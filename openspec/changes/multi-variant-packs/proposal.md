# Proposal: Multi-Variant Packs (x2/x3) — Pack Sale with Per-Variant Stock Decrement

## Intent

Articles sold as packs (x2/x3 units, ONE published price covering the WHOLE pack) are a business need with zero model support: the data model is 1:1 line-item↔variant, so buying a pack today decrements stock from a single variant and prices every unit at the full pack price. This change lets buyers choose the N variants composing a pack (repeats allowed), decrements stock from EVERY chosen variant, and lets admins mark a product as "venta en pack" with its size (x2/x3) in the product form — the owner-approved requirement.

## Current State

- `products.price` = single published price; NO pack marker anywhere (no column, no tag, no code convention — verified in all 9 migrations, shared types, web/mobile code, dev DB)
- Every purchase path (online `create_order_from_cart` RPC, in-person sales, admin orders) creates one line item per variant; stock triggers decrement exactly `NEW.variant_id`
- **Verified correction to exploration:** `create_order_from_cart` (00004) computes `unit_price = products.price` per cart row — a multi-row pack would charge N× the pack price, so the RPC MUST change (exploration's "RPC unchanged" claim was wrong)
- `cart_items` stores NO price (id, user_id, product_id, variant_id, quantity) — pricing is derived at checkout and at display time
- In-person sales `BEFORE INSERT` trigger already validates stock atomically per row; `handle_order_status_stock_adjust` already iterates all order_items (cancel/reactivate correct)
- Admin in-person sales already allows multiple line items per product — the pack UX exists in embryo, without price awareness

## Scope

### In Scope (v1)

1. `products.pack_units smallint NULL` + CHECK + reconciliation + regenerated DB types
2. Admin product form (web): "Venta en pack" toggle + size x2/x3, persisted via create/update
3. Storefront pack builder (web product detail): N variant slots, repeats allowed, stock-aware, one add-to-cart producing N rows (repeats collapsed to quantity)
4. Cart display (web): visual pack grouping, "Pack xN" badge, split prices
5. `create_order_from_cart` RPC: quantity-aware pack price split (integer cents, last row absorbs remainder) — authoritative pricing
6. In-person sales: pack-aware `VariantPickerDialog` (N slots + split prices; stock validated by existing BEFORE trigger)
7. Shared `splitPackPrice` util + types/validators
8. Guard: block pack products in the admin manual-order form (explanatory message) until follow-up

### Out of Scope

- Admin manual-order pack builder (deferred; the guard ships in v1)
- Partial packs ("buy 1 unit of a pack") — rejected policy, see Decision 3
- Dynamic packs ("pick any 3 of these 5") — requires composition model (Approach A/C)
- Pack-aware grouping in order history (rows show split prices; acceptable)
- Tags-based pack markers (rejected, see Alternatives)
- Mobile in-person sales (feature does not exist)
- Mobile app (storefront pack builder, mobile cart, mobile admin form) — paused by owner until further notice; v1 is web-only

## Capabilities

> Contract with sdd-spec. Each modified capability needs a delta spec; `pack-sales` becomes a new full spec.

### New Capabilities

- `pack-sales`: pack marking (admin), pack selection builder (storefront), split pricing, cart grouping

### Modified Capabilities

- `database-schema`: `products.pack_units` column + CHECK constraint
- `admin-catalog`: product form gains pack marking (web)
- `catalog-display-web`: product detail gains pack builder (web)
- `cart-web`: pack grouping + split price display
- `checkout-flow`: `create_order_from_cart` gains pack-aware pricing
- `shared-package`: `splitPackPrice` util + `Product.packUnits`

## Approach

Approach B (exploration recommendation): pack marker on products + multi-row cart — with two corrections from verification: (1) persistence is a **typed column**, not a tag; (2) the **checkout RPC must be modified** (it prices every row at `products.price`, which would overcharge N×).

### Resolved decisions

1. **Pack marker persistence**: `products.pack_units smallint NULL CHECK (pack_units IS NULL OR pack_units >= 2)`. NULL = not a pack; 2/3 = x2/x3 (admin UI offers only x2/x3 per owner; CHECK allows future sizes without migration). New migration `00007_product_pack_units.sql` + reconciliation into `00000_full_database.sql` (repo convention from the SKU trigger). Admin form: "Venta en pack" toggle + pack-size select in `ProductForm.tsx` (web), passed through `use-product-mutations.ts`. Typed column over tag: queryable, DB-enforceable, no catalog-filter leakage.
2. **Price semantics**: `products.price` = TOTAL pack price. Split in integer cents: `per_unit = floor(total_cents / pack_units)`, LAST row of the pack group absorbs `total_cents mod pack_units`. Quantity-aware: a collapsed repeated-variant row (quantity k) is still priced per-unit; the remainder lands on the group's last cart row (ROW_NUMBER/COUNT OVER product_id in the RPC). Authoritative in the RPC; mirrored by shared `splitPackPrice` for display. Sum of rows = `products.price` EXACTLY. Variant discounts keep applying per-row on the split base; mixed-discount drift ≤ N cents, accepted.
3. **Partial availability**: ALL-OR-NOTHING. All N slots must be filled with in-stock variants; the add-to-cart/confirm button stays disabled until complete; insufficient-stock slots show "stock insuficiente" and block. Rationale: a pack is a single priced offer — partial packs break price semantics and create split-stock edge cases.
4. **Repeated variant**: ALLOWED when stock allows (real case: "2x Talle S Negro"). Mechanism: the builder collapses repeats to `Map<variantId, qty>` before insert (a batch upsert would error on duplicate keys in one statement); cart upsert accumulates quantity as today; the order_item with quantity k decrements k; cancel/reactivate already correct.
5. **Surfaces v1**: web storefront product detail, web cart display, admin product form (web), in-person sales picker. Deferred: admin manual-order form (guarded in v1), order-history grouping. The mobile app (storefront, cart, admin) is out of scope — paused by owner until further notice; the shared `splitPackPrice` util keeps the door open for a later mobile phase.
6. **Stock validation**: blocked at selection time in the builder — a pack can never be added partially. Online checkout keeps the existing per-row clamp-at-0 behavior (consistent with single products today, which also do not hard-block); in-person sales keeps its atomic BEFORE-trigger exception. No new DB-level pack validation in v1; revisit only if client bypass is observed.

## Alternatives considered

- **A — Pack composition table + pack-aware cart**: explicit `product_pack_variants` join table + cart parent concept. HIGH migration cost (new table, cart_items change, checkout RPC, cart-merge logic, 3 platforms). Presumes a fixed composition, which we explicitly do NOT have — the buyer composes the pack at purchase time. Rejected.
- **C — JSONB pack config on products**: flexible for future pack types, but unpacks for validation, weaker DB enforcement, and carries the same cart/RPC/merge cost as A. Rejected.
- **Tags `pack-2`/`pack-3`**: free-text (typo-prone), leaks into marketing tag filters, no DB enforcement, admin must maintain string conventions. Rejected in favor of the typed column (Decision 1).

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/00007_product_pack_units.sql` | New | pack_units column + CHECK + comment |
| `supabase/migrations/00000_full_database.sql` | Modified | reconcile column (fresh DBs converge) |
| `supabase/migrations/00004_bank_transfer_settings.sql` | Modified | `create_order_from_cart` pack price split |
| `packages/shared/src/utils/pack.ts` | New | `splitPackPrice` (integer cents, remainder absorption) |
| `packages/shared/src/types/product.ts`, `validators/product.ts`, `utils/index.ts` | Modified | `packUnits` + export |
| `packages/web/src/lib/database.types.ts` | Modified | regenerated after migration |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` + `api/use-product-mutations.ts` | Modified | pack field + pass-through |
| `packages/web/src/features/catalog/pages/product-detail-page.tsx` | Modified | pack builder (N slots) |
| `packages/web/src/features/cart/*` (queries, use-anonymous-cart, cart components) | Modified | pack grouping + split display |
| `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx` | Modified | pack-aware VariantPickerDialog |
| `packages/mobile/*` | — | untouched in v1 (owner pause) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| RPC prices every pack row at full price → N× overcharge | High | RPC split is a core deliverable; vitest on `splitPackPrice`; verification asserts order totals |
| Cart upsert collapses repeated variant, breaking the N-row assumption | Med | client collapses repeats pre-insert; RPC is quantity-aware; display groups by product + pack flag |
| Remainder/rounding drift in split prices | Low | integer cents + last-row absorption; unit tests cover odd totals |
| Pack × variant-discount interaction drift | Low | ≤ N cents; documented in spec |
| Pack product picked manually in admin orders → wrong charged price | Med | v1 guard blocks pack products in the admin order form with a message |

## Rollback Plan

Drop migration `00007` (additive column; NULL rows behave exactly as today — no data migration, no destructive DDL). Revert `create_order_from_cart` from git history. Remove builder/grouping components, the admin form field, and the guard. Existing orders/stock untouched.

## Dependencies

- `products.price numeric(10,2)` (present), per-variant `product_variants.stock` (present)
- Supabase type regeneration after migration (`supabase gen types`)
- Unit tests: web vitest only (`pnpm --filter web test`) — shared has no test runner, tests live in web (repo convention from auto-sku-generation)

## Success Criteria

- [ ] `splitPackPrice` unit tests pass (remainder cases, collapsed-quantity cases) — `pnpm --filter web test`
- [ ] Admin marks product as pack x2/x3 → `pack_units` persisted; non-pack products keep `pack_units = NULL`
- [ ] Pack product detail (web) shows N slots; add-to-cart yields rows whose subtotals sum to `products.price` exactly
- [ ] Order from a pack cart decrements stock from EVERY chosen variant (repeats decrement by multiplicity)
- [ ] In-person pack sale: picker enforces N slots, rows price to the pack total, BEFORE trigger validates per-variant stock atomically
- [ ] Admin order form blocks pack products with an explanatory message
- [ ] Existing single-product cart/checkout/in-person flows unchanged (regression pass)
