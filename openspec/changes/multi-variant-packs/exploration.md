# SDD Exploration — Multi-Variant Packs (x2/x3) Stock Decrement

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: explore | Date: 2026-08-11

## Current State

### Problem Statement

Articles sold as packs (x2, x3 units) have a single published price covering the whole pack, but the current model only decrements stock from one variant. The buyer must be able to pick the specific variants composing the pack, and stock must be decremented from ALL chosen variants.

### Data Model (DB + Shared Types)

**Core tables:**

| Table | Columns | Role |
|-------|---------|------|
| `products` | id, name, slug, price, tags[], is_active, cost | Single published price per product |
| `product_variants` | id, product_id, size, color, stock, sku, discount | Stock lives HERE (per variant) |
| `cart_items` | id, user_id, product_id, **variant_id** (nullable), quantity | 1 row = 1 variant, upserted by (user_id, product_id, variant_id) |
| `order_items` | id, order_id, product_id, **variant_id** (nullable), quantity, unit_price, subtotal | 1 row = 1 variant |
| `in_person_sale_items` | id, sale_id, product_id, **variant_id** (nullable), quantity, unit_price, discount, subtotal | 1 row = 1 variant |

**Variant identity:** `size` (text, nullable) + `color` (text, nullable). Stock is an `int` per variant row.

**Pack markers:** NONE. No `pack_size`, `units_per_sale`, `x2`, `x3`, `combo`, `bundle`, or any analogous field exists in:
- DB schema (all 9 migrations: 00000 through 20260809190841)
- Shared types (`packages/shared/src/types/product.ts`, `productVariantSchema`)
- Shared validators (`packages/shared/src/validators/product.ts`)
- Web/mobile code (grep for pack/combo/x2/x3 returns zero relevant matches)
- Live dev DB data (15 products, 40 variants — no pack-labeled articles found)

**Price semantics:** `products.price` is a single number displayed as the unit price in the catalog. For a pack, this represents the full pack price, but the system has no awareness that it is a pack.

### Purchase Flow

**1. Online Storefront (web + mobile):**
- Product detail page: variant selector (size + color chips) → resolves ONE variant_id via `resolveInStockVariantId()` (`packages/shared/src/utils/variants.ts:79`)
- Add to cart: `addToCart({ product_id, variant_id, quantity: 1 })` — single variant, qty 1
  - Web: `packages/web/src/features/catalog/pages/product-detail-page.tsx:483-486`
  - Mobile: `packages/mobile/src/app/producto/[slug].tsx:66-70`
- Cart: DB-backed `cart_items` table (authenticated) or localStorage (anonymous)
  - Upsert by (user_id, product_id, variant_id) — same variant increments qty
  - `packages/web/src/features/cart/api/queries.ts:123-173`
  - Anonymous cart: `packages/web/src/features/cart/hooks/use-anonymous-cart.ts:130-163`
- Checkout: `create_order_from_cart` RPC (SQL)
  - `supabase/migrations/00004_bank_transfer_settings.sql:60-222` (latest version)
  - Creates `orders` + `order_items` rows from `cart_items`, then clears cart

**2. In-Person Sales (web admin only):**
- `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx`
- `VariantPickerDialog` (line 421): picks ONE variant per product → `handleConfirmVariant` (line 973) adds one `SaleItem` with single `variantId`
- `createSale()` (line 245): inserts into `in_person_sales` + `in_person_sale_items`
- Mobile has NO in-person sales (only cash movements view at `/admin/caja`)

**3. Admin Orders (web admin):**
- `packages/web/src/features/admin/orders/api/use-order-queries.ts:297-374`
- `createAdminOrder()`: inserts `orders` + `order_items` rows — each item has one `variant_id`

### Stock Decrement Paths (exact evidence)

**Path 1 — Online checkout (storefront orders):**
- Trigger: `trg_order_item_stock_decrement` → AFTER INSERT on `order_items`
- Function: `handle_order_item_stock_decrement()` (00000_full_database.sql:810-828)
- Code:
  ```sql
  if NEW.variant_id is not null then
    update product_variants
    set stock = greatest(stock - NEW.quantity, 0)
    where id = NEW.variant_id;
  end if;
  ```
- **Why only one variant:** The trigger runs per-row on `order_items`. Each row carries ONE `variant_id`. The trigger only decrements `WHERE id = NEW.variant_id` — the single variant in that row.

**Path 2 — In-person sales:**
- Trigger: `trg_decrement_stock_in_person_sale` → BEFORE INSERT on `in_person_sale_items`
- Function: `decrement_stock_on_in_person_sale()` (20260809190841_in_person_sales.sql:89-118)
- Code:
  ```sql
  if NEW.variant_id is not null then
    select stock into current_stock from product_variants where id = NEW.variant_id;
    if current_stock < NEW.quantity then
      raise exception 'Insufficient stock for variant %. Available: %, Requested: %',
        NEW.variant_id, current_stock, NEW.quantity;
    end if;
    update product_variants set stock = stock - NEW.quantity where id = NEW.variant_id;
  end if;
  ```
- **Why only one variant:** Same as Path 1 — one variant_id per row. Additionally, this BEFORE trigger validates stock availability before the decrement (atomic per item).

**Path 3 — Admin orders (same trigger as Path 1):**
- `createAdminOrder()` inserts `order_items` rows → same `trg_order_item_stock_decrement` trigger fires.

**Path 4 — Cancel/reactivate stock adjust:**
- Trigger: `trg_order_status_stock_adjust` → AFTER UPDATE on `orders`
- Function: `handle_order_status_stock_adjust()` (00000_full_database.sql:832-858)
- Iterates ALL `order_items` for the order — each item's variant gets returned/re-decremented independently.
- **This already handles multi-item orders correctly** — no change needed here.

### Root Cause Summary

The entire data model enforces a **1:1 relationship between a line item and a product variant**. This is enforced at three levels:

1. **DB schema:** `cart_items.variant_id`, `order_items.variant_id`, `in_person_sale_items.variant_id` — each is a single nullable FK
2. **Stock triggers:** Each trigger decrements `WHERE id = NEW.variant_id` — exactly one row
3. **Frontend UX:** Variant selector picks ONE size+color → resolves ONE variant_id → add-to-cart with that single variant

For a pack article (e.g., "Pack 2 Remeras" at $20,000 covering 2 shirts), the buyer must pick 2 different variants (e.g., S/Negro + M/Blanco), but:
- The cart model stores each as a separate row with the full pack price
- No concept of "these 2 variants belong together as one pack purchase"
- Price semantics are broken: each cart row shows $20,000 (the pack price), not $10,000 (per-unit)

### Reusable Patterns

1. **BEFORE INSERT trigger with stock validation** (in-person sales): `decrement_stock_on_in_person_sale()` validates sufficient stock BEFORE decrementing — fails atomically. The online checkout trigger uses AFTER INSERT with `greatest(stock - qty, 0)` (allows going below 0). The BEFORE pattern is safer and should be preferred for pack stock validation.

2. **SKU autofill trigger** (00002): `trg_variant_sku_autofill` — shows the BEFORE trigger + function pattern for product_variants. Reusable architecture for any new trigger on variant-level operations.

3. **`handle_order_status_stock_adjust`** trigger: demonstrates iterating order_items for a given order and adjusting stock per variant — already works for multi-variant orders (when there are multiple items).

---

## Candidate Approaches

### Approach A: Pack Composition Table + Pack-Aware Cart

**Concept:** Add a `product_pack_variants` join table defining which variants compose a pack, and extend the cart to store pack selections.

**DB changes:**
- New table: `product_pack_variants (product_id, variant_id, position_in_pack)`
  - Defines that a pack article includes variants at position 1, 2, 3, etc.
  - Alternative: simple `products.pack_size int NOT NULL DEFAULT 1` (null=not-a-pack) + `products.pack_requires_same_variant bool DEFAULT false` (allows picking same variant multiple times or different ones)
- Extend `cart_items`: add `pack_selection jsonb` (e.g., `[{"variant_id": "v1"}, {"variant_id": "v2"}]`) or `pack_parent_id uuid` linking multiple cart rows as one pack

**UX:**
- Product detail: for pack products, show N variant pickers (one per unit in the pack)
- Cart: pack item displayed as a single card showing all N selected variants
- Checkout: RPC inserts N order_items from one pack cart item

**Stock:** Each variant in the pack gets its own order_item row → existing trigger handles decrement per-variant correctly.

**Pros:**
- Clean data model; pack composition is explicit in the DB
- Cart shows pack as one logical item (good UX)
- Stock cancel/reactivate already works for multi-item orders

**Cons:**
- New table + migration
- Extends cart_items schema (or adds a parent concept)
- Requires pack-aware checkout RPC logic
- Cart merge logic (anonymous → authenticated) must handle packs
- 3 platforms affected: web cart, mobile cart, in-person sales

**Migration cost:** HIGH (new table, modified cart_items, modified checkout RPC, shared types)

---

### Approach B: Pack Tag + Multi-Row Cart (Zero DB Schema Change)

**Concept:** Reuse the existing cart/order model. A "pack" product simply adds N separate cart rows (one per variant), grouped by a product tag. No new tables, no schema changes.

**DB changes:** NONE. Just add a product tag like `'pack-2'` or `'pack-3'` to identify pack products.

**UX:**
- Product detail: for pack-tagged products, show N variant pickers (size+color for each unit)
- Add-to-cart: inserts N separate `cart_items` rows (one per variant), each at price = pack_price / N
- Cart: pack items show as separate rows, possibly visually grouped under a "Pack" header
- Checkout: existing `create_order_from_cart` RPC processes them as regular items → each gets its own order_item → each triggers stock decrement independently

**Stock:** Works immediately — each cart row → order_item → trigger decrements its own variant.

**Pros:**
- ZERO DB schema changes
- Existing triggers handle everything (stock decrement, cancel/reactivate)
- Checkout RPC unchanged
- Cart merge unchanged (upsert by user_id + product_id + variant_id)
- Lowest risk, fastest to implement
- In-person sales already support multiple items per sale

**Cons:**
- Cart shows pack as N separate rows (less elegant UX, but manageable with visual grouping)
- Price must be split: pack_price / N per row (rounding issue for odd prices)
- No DB-level enforcement of "all N variants must be selected" — client-side validation only
- Admin must carefully set price divisible by pack_size
- Cart item display needs pack awareness (grouped view, pack badge)

**Migration cost:** LOW (product tag only, all frontend changes)

---

### Approach C: Pack Composition JSONB on Product + Pack Cart Extension

**Concept:** Store pack composition directly on the product row as JSONB, and extend cart with a pack selection payload.

**DB changes:**
- Add `products.pack_config jsonb` (e.g., `{"units": 2, "variants_required": 2, "price_is_total": true}`)
- Extend `cart_items` with `pack_selection jsonb` storing the chosen variant_ids for pack products

**UX:** Same as Approach A.

**Pros:**
- Pack config lives on the product (single source of truth)
- JSONB is flexible for future pack types (e.g., "pick any 3 from these 5 variants")

**Cons:**
- JSONB on products complicates queries (need to unpack for validation)
- cart_items extension means checkout RPC changes
- Less normalized than Approach A (join table)
- JSONB validation is harder to enforce at DB level
- Cart merge logic needs pack awareness

**Migration cost:** MEDIUM (product column + cart_items column + checkout RPC)

---

## Recommendation

**Approach B: Pack Tag + Multi-Row Cart (Zero DB Schema Change)**

Rationale:
1. **Lowest risk:** No DB schema changes, no migration risk, no trigger modifications
2. **Immediate stock correctness:** Existing BEFORE INSERT trigger on `in_person_sale_items` already validates and decrements per variant. Existing AFTER INSERT trigger on `order_items` handles online orders.
3. **Fastest to implement:** Only frontend changes (product detail variant picker, cart display, product form)
4. **In-person sales already works:** The admin can already add multiple items to a sale (different variants of the same product) — this is exactly the pack UX
5. **Cancel/reactivate already works:** `handle_order_status_stock_adjust` iterates all order_items per order
6. **Price splitting:** Use `Math.round(pack_price / pack_size)` for each row's unit_price, with the last row absorbing any remainder to preserve exact total
7. **Visual grouping:** Add a lightweight cart display component that groups items by pack (matching product_id + pack tag) without changing the underlying data model

**Tradeoff accepted:** Cart shows N rows instead of 1 grouped row. This is acceptable because:
- In-person sales already work this way (N sale items)
- The cart is temporary (items are cleared after checkout)
- Visual grouping via UI (no DB change) is sufficient
- The admin product form only needs a "Pack units" field (integer) to enable the multi-variant picker

---

## Risks and Open Questions

### Open Questions
1. **How to mark a product as pack?** Options: (a) product tag `'pack-2'` / `'pack-3'`, (b) new `products.pack_units int` column (null=not-a-pack), (c) `products.tags[]` containing `'pack'` + a pack_units field. Need owner input on the preferred mechanism.
2. **Price semantics:** Is the published `products.price` the total pack price (e.g., $20,000 for 2 shirts) or per-unit price (e.g., $10,000 × 2)? The current model shows price as the displayed price in catalog — for packs, this should be the total pack price.
3. **Partial pack availability:** What if 2 of 3 pack variants are in stock but the 3rd is not? Should the pack be purchasable? Options: (a) all-or-nothing (minimum stock = pack_size per variant), (b) allow partial packs (buyer picks from available variants only).
4. **Can pack variants be the SAME variant?** (e.g., "2-pack Remera S/Negro" — buyer picks the same variant twice) vs. (e.g., "2-pack Remeras: pick S/Negro + M/Blanco")
5. **Admin in-person sales:** The existing VariantPickerDialog already allows adding multiple items of the same product (different variants) — should this already work for packs? Or does the admin need a dedicated "pack builder" dialog?

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Price rounding when splitting pack_price across N items | Medium | Low | Use remainder absorption: first N-1 items get `floor(price/N)`, last item gets `price - (N-1)*floor(price/N)` |
| Cart UX confusion (N separate rows for one pack) | Medium | Medium | Visual grouping: badge "Pack x2", collapsible group header |
| Client-side validation bypass (not all N variants selected) | Low | High | Validate in product detail page before enabling add-to-cart button |
| Mobile variant picker needs N iterations | Medium | Medium | Build a reusable pack variant picker component (shared or duplicated per platform) |
| Anonymous cart merge doesn't group pack rows | Low | Low | Cart display groups by product_id + pack tag, not by cart row structure |
| Admin forgets to mark product as pack | Low | High | Add pack_units field to product form with validation |
