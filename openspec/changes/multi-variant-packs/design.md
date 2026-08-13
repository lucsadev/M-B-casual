# Design: Multi-Variant Packs (x2/x3)

> Change: multi-variant-packs | Scope: WEB ONLY (mobile paused)
> Approach: typed pack_units marker + multi-row cart (zero new tables)

## 1. Architecture Overview

```
[Admin ProductForm] --pack_units 2|3--> products.pack_units (DB marker)
                                              |
[Storefront Detail] <--packUnits >= 2--       |
   pack builder: N slots (repeats allowed)    |
   all slots in-stock -> collapse Map<variantId, qty>
        | addToCart per entry (cart upsert accumulates qty)
        v
   cart_items: N rows (NO price stored) ------> [Cart UI] group by product_id
                                                  "Pack xN" badge + split display
                                                      |
        create_order_from_cart RPC (00004) <---------+
           CTE split: floor(cents / pack_units), last row absorbs remainder
                          |
                          v
   orders + order_items: N rows, split unit_price, sum = products.price EXACTLY
                          |
        +-----------------+--------------------+
        v                                      v
trg_order_item_stock_decrement          in-person sales (admin):
(per row: stock -= qty, variant_id)     VariantPickerDialog N slots -> N SaleItems
        |                               trg_decrement_stock_in_person_sale
        v                               validates + decrements atomically per row
cancel/reactivate: trg_order_status_stock_adjust iterates all order_items
```

Pack articles are marked by a typed column (`products.pack_units`, NULL = not a pack) and sold as **N separate cart/order rows** — one per chosen variant, each at a split price — instead of a pack container. The database model (cart_items/order_items/in_person_sale_items: one variant_id per row) and every stock trigger already work unchanged for N rows; the change concentrates on (a) the checkout RPC, which currently prices every row at the full `products.price` (an Nx overcharge for packs), (b) a shared `splitPackPrice` util mirroring the RPC math for display, and (c) web-only UI: admin product form, storefront pack builder, cart grouping, in-person picker, and an admin-order guard.

## 2. Database Design

### Migration 00007_product_pack_units.sql (new)

```sql
alter table public.products
  add column pack_units smallint;

alter table public.products
  add constraint products_pack_units_check
  check (pack_units is null or pack_units >= 2);

comment on column public.products.pack_units is
  'Pack size (x2/x3): number of variants the buyer must pick for the single pack price. NULL = not a pack.';
```

- Additive and nullable: NULL rows behave exactly as today; rollback = drop the column, no data migration.
- Admin UI offers only 2/3; the CHECK allows future sizes without a new migration.
- No RLS/policy changes — policies are row-level on `products` and are unaffected by a new column.

### Reconcile 00000_full_database.sql (modify)

00000 is the fresh-DB snapshot and is **currently out of sync**:

- `products` CREATE TABLE (lines 70-82) must gain `pack_units smallint` + CHECK inline.
- The `create_order_from_cart` body (lines 543-639) is the **pre-00004 simple version** — it lacks shipping settings and the bank-transfer auto-message. Reconciliation replaces it with the 00004 body (00004:60-222) **plus** the pack split (Section 3), so fresh databases converge with the dev DB.
- Note: 00000 also lacks `products.cost` (00005) — pre-existing drift, out of scope for this change, flagged to the owner.

### Type regeneration

- Regenerate `packages/web/src/lib/database.types.ts` after migration (`supabase gen types` on the public schema) -> `products.pack_units: number | null`.
- Shared `Product` type/validators are hand-maintained (Section 4), not generated.

## 3. RPC Design: create_order_from_cart

**Current problem:** every cart row computes `unit_price = products.price` (discounted) and `subtotal = unit_price * quantity`. A pack bought as N rows is therefore charged N x the pack price.

**Solution:** a priced CTE that (1) splits the discounted pack total in integer cents per row and (2) marks the group's last cart row (ROW_NUMBER/COUNT OVER product_id) to absorb the cents remainder. The same CTE feeds both `v_total` and the `order_items` insert:

```sql
-- AFTER: priced + split CTEs (used for v_total AND the order_items insert)
with priced as (
  select
    ci.id,
    ci.product_id,
    ci.variant_id,
    ci.quantity,
    p.pack_units,
    round(p.price * (1 - coalesce(pv.discount, 0)::numeric / 100), 2) as base, -- discounted pack total
    row_number() over (partition by ci.product_id order by ci.created_at, ci.id) as rn,
    count(*)     over (partition by ci.product_id)                              as cnt
  from cart_items ci
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where ci.user_id = v_user_id
),
split as (
  select
    *,
    case when pack_units is not null
         then floor(base * 100 / pack_units) / 100        -- integer-cents per-unit
         else base end                                    as unit_price,
    case when pack_units is not null
         then mod(base * 100, pack_units)::numeric / 100  -- cents remainder
         else 0 end                                       as remainder
  from priced
)
-- v_total (replaces the current sum in step 4):
select coalesce(sum(
  unit_price * quantity
  + case when pack_units is not null and rn = cnt then remainder else 0 end
), 0) into v_total from split;

-- order_items insert (replaces the current insert in step 6):
insert into order_items (order_id, product_id, variant_id, quantity, unit_price, subtotal)
select v_order_id, product_id, variant_id, quantity, unit_price,
       unit_price * quantity
       + case when pack_units is not null and rn = cnt then remainder else 0 end
from split;
```

Properties:

- **Single products** (`pack_units IS NULL`): `unit_price = base`, `remainder = 0` -> byte-identical to today.
- **Packs**: `floor(cents/n) * n + (cents mod n) = cents` -> row subtotals sum to the discounted pack total **exactly**.
- **Quantity-aware**: a collapsed repeated-variant row (quantity k) prices at per-unit x k; the remainder lands once on the group's **last cart row** (stable order `created_at, id`).
- **Mixed variant discounts**: each row splits its own discounted base; drift <= N cents, accepted (proposal Decision 2).
- No changes to `cart_items`/`order_items` schema — one `variant_id` per row keeps the stock triggers working as-is.

## 4. Shared Util: splitPackPrice

`packages/shared/src/utils/pack.ts` — display-side mirror of the RPC split:

```ts
export interface SplitPackPriceInput {
  total: number;     // products.price — pack total (ARS)
  packUnits: number; // products.pack_units (2 | 3)
  quantity?: number; // row quantity (collapsed repeats); default 1
  discount?: number; // variant discount % applied to the split base; default 0
  rowIndex: number;  // 1-based position of this cart row within the pack group
  rowCount: number;  // total cart rows composing the group
}

export function splitPackPrice(input: SplitPackPriceInput): {
  unitPrice: number; // per-unit price (cents-floor)
  subtotal: number;  // unitPrice * quantity (+ cents remainder when rowIndex === rowCount)
};
```

Algorithm (mirrors RPC): `baseCents = round(total * (1 - discount/100) * 100)`; `perUnitCents = floor(baseCents / packUnits)`; `subtotalCents = perUnitCents * quantity + (rowIndex === rowCount ? baseCents % packUnits : 0)`.

Exports & types:

- `packages/shared/src/utils/index.ts`: `export { splitPackPrice } from './pack.ts';`
- `packages/shared/src/types/product.ts`: add `packUnits?: number | null;` to `Product` (doc comment: pack size; null/undefined = not a pack).
- `packages/shared/src/validators/product.ts`: add `packUnits: z.number().int().min(2).nullable().optional()` to `productSchema` and `productCreateSchema` (create default `null`).

## 5. Client Components (WEB ONLY)

### 5.1 Admin ProductForm.tsx + use-product-mutations.ts

- New react-hook-form field `packUnits: number | null` (zod: `null` default; when the "Venta en pack" toggle is on -> union `2 | 3`).
- Toggle + pack-size select (x2/x3) rendered next to the price field (ProductForm.tsx:266 area).
- Pass-through: `createProduct`/`updateProduct` payloads gain `pack_units` (nullable); `ProductFormPage` maps `values.packUnits` -> `pack_units` on both create and update.

### 5.2 Storefront pack builder (product-detail-page.tsx)

- When `product.packUnits >= 2`, render **N slot pickers** instead of the single size/color selector.
- Each slot reuses the existing chips pattern + `resolveInStockVariantId()` (shared/utils/variants.ts), scoped per slot.
- **Repeats allowed** while stock permits: a slot may pick an already-picked variant when `variant.stock - sum of prior picks > 0`.
- Each slot shows its `splitPackPrice` per-unit; the price block shows the pack total with a "Pack x2/x3" badge.
- **All-or-nothing**: add-to-cart stays disabled until ALL N slots resolve to in-stock variant ids (proposal Decision 3).
- On add: collapse slots to `Map<variantId, qty>` (repeats merge), then call `addToCart` once per entry — `addItem()` (cart/api/queries.ts:123) upserts by `(user_id, product_id, variant_id)` and accumulates quantity; a single batch upsert would collide on the unique key.

### 5.3 Cart display (cart queries + components)

- `cart/api/queries.ts` product join (currently selects `images, price` only) must add `pack_units`.
- Group rendered rows by `product_id` when `pack_units >= 2`: "Pack xN" badge, per-slot rows priced via `splitPackPrice`, group total = sum of rows = `products.price`.
- Applies to both the DB cart and the anonymous localStorage cart (grouping is a display concern; `use-anonymous-cart.ts` item mapping is unchanged).

### 5.4 In-person VariantPickerDialog (InPersonSalesPage.tsx)

- For pack products: **N slots** (repeats allowed; stock-aware via the existing `getAvailableStock` pattern at lines 437-442, which already subtracts already-picked quantity).
- Confirm adds N `SaleItem`s with split `unitPrice` (`splitPackPrice`) so the sale total = `products.price`.
- Stock enforcement: the existing BEFORE-insert trigger `decrement_stock_on_in_person_sale` raises an exception atomically on insufficient stock — **no new validation needed**.

### 5.5 Admin manual order guard

- In the admin order form (createAdminOrder path, use-order-queries.ts:297-374): exclude pack products (`pack_units >= 2`) from the picker and show "Este producto se vende en pack — usá Ventas en persona por ahora" if attempted.
- Client-side guard; the DB still accepts inserts (a real pack builder ships as follow-up).

## 6. Stock Triggers — NO CHANGES NEEDED

| Trigger | Fires on | Why it already handles packs |
|---|---|---|
| `trg_order_item_stock_decrement` | AFTER INSERT `order_items` | Per-row: `stock = greatest(stock - NEW.quantity, 0)` where `id = NEW.variant_id`. N pack rows -> N decrements; a collapsed repeat (quantity k) decrements k. |
| `trg_decrement_stock_in_person_sale` | BEFORE INSERT `in_person_sale_items` | Validates `stock >= quantity` then decrements, atomically per row. N pack rows -> N validations + decrements. |
| `trg_order_status_stock_adjust` | AFTER UPDATE `orders` | Iterates ALL order_items of the order via join — cancel returns stock, reactivation re-decrements. Already multi-variant correct. |

## 7. Deployment Order

1. Apply migration `00007_product_pack_units.sql`.
2. Reconcile `00000_full_database.sql` (products column + RPC body -> 00004 version + pack split).
3. Update `create_order_from_cart` in `00004_bank_transfer_settings.sql`; regenerate `packages/web/src/lib/database.types.ts`.
4. Shared: `pack.ts` + `Product.packUnits` + validators + index export.
5. Web admin: ProductForm + mutations (so admins can tag products first).
6. Web storefront pack builder (product detail).
7. Web cart grouping/badge display.
8. In-person VariantPickerDialog pack support.
9. Admin order guard.
10. Unit tests + regression pass (`pnpm --filter web test`).

## 8. Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (web vitest) | `splitPackPrice` | Even/odd totals, remainder absorption, collapsed quantity k, discount base, mixed-discount drift, rowIndex/rowCount edges |
| Unit (web vitest) | Pack builder collapse | N slots -> `Map<variantId, qty>`; repeats; button disabled until complete |
| Unit (web vitest) | ProductForm validation | Toggle on -> 2/3; off -> null; create/update payload |
| Integration (SQL, verify phase) | `create_order_from_cart` | Pack cart -> `order_items` sum = `products.price` exactly; per-row unit_price = floor split; last row carries remainder |
| Integration (SQL, verify phase) | Stock decrement | Pack order decrements EVERY chosen variant; repeats by multiplicity; cancel/reactivate restores each |
| E2E / manual | In-person sale | N-slot picker, split prices, BEFORE trigger raises on short stock |
| Regression | Single-product flows | Cart/checkout/in-person identical for `pack_units IS NULL` |

## 9. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| RPC prices pack rows at full price -> Nx overcharge | High if RPC skipped | Split is a core deliverable; verify asserts order totals; `splitPackPrice` unit tests mirror the RPC math |
| Cart upsert collapses repeats, breaking the N-row assumption | Medium | Client collapses pre-insert; RPC is quantity-aware; display groups by product + pack flag |
| Remainder/rounding drift in split prices | Low | Integer cents + last-row absorption; tests cover odd totals |
| Pack x variant-discount drift | Low | <= N cents, accepted and documented |
| Pack picked in admin manual order -> wrong charged price | Medium | v1 guard blocks with explanatory message |
| 00000 reconciliation drift (also missing `cost`) | Low | Reconcile in-scope items only; pre-existing drift flagged to owner |
| Client bypass of all-or-nothing validation | Low | Selection-time blocking; revisit DB-level pack validation only if observed |
