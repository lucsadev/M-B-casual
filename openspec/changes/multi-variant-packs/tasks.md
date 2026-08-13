# Tasks: Multi-Variant Packs (x2/x3) — web-only v1

## Review Workload Forecast

Estimated changed lines: ~1,150–1,300 (well over the 400-line budget; split into 7 chained PRs = phases 1–7, base = previous PR branch; phase 8 regression rides along).

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Phase 1: DB Foundation (PR 1)

- [ ] 1.1 Create `supabase/migrations/00007_product_pack_units.sql`: pack_units smallint + CHECK (NULL OR >= 2) + comment. [SQL: CHECK rejects 1/0] (S)
- [ ] 1.2 Reconcile `00000_full_database.sql` products CREATE: inline pack_units + CHECK. [SQL: fresh DB converges] (S)
- [ ] 1.3 Regenerate `packages/web/src/lib/database.types.ts` (`supabase gen types`). [type-check] (S)

## Phase 2: Shared (PR 2)

- [ ] 2.1 Create `packages/shared/src/utils/pack.ts` `splitPackPrice` (floor cents per unit, last row absorbs remainder, reject units < 2) + export `utils/index.ts`. [vitest] (M)
- [ ] 2.2 `types/product.ts` packUnits?: number|null; `validators/product.ts` nullable int min 2 (both schemas). [vitest, type-check] (S)
- [ ] 2.3 New `web/src/features/cart/__tests__/split-pack-price.test.ts`: even/odd/collapsed/discount/edge/invalid. [`pnpm --filter web test`] (M)

## Phase 3: RPC (PR 3)

- [ ] 3.1 Rewrite pricing `00004_bank_transfer_settings.sql` create_order_from_cart (~L60): priced+split CTE (floor cents; last row via ROW_NUMBER/COUNT) feeds v_total + order_items insert. [SQL: pack sum = products.price; non-pack identical] (M)
- [ ] 3.2 Replace 00000 RPC body (L543-639) with 00004 body + split. [SQL: fresh RPC matches dev] (M)

## Phase 4: Admin ProductForm (PR 4)

- [ ] 4.1 `admin/products/components/ProductForm.tsx` (~L266): packUnits + "Venta en pack" toggle + x2/x3 select. [vitest: on → 2|3, off → null] (S)
- [ ] 4.2 `admin/products/api/use-product-mutations.ts` + `pages/ProductFormPage.tsx`: map packUnits → pack_units. [vitest, type-check] (S)
- [ ] 4.3 New `admin/products/__tests__/product-form.test.tsx`: pack persisted; non-pack NULL. [vitest] (S)

## Phase 5: Storefront Builder (PR 5)

- [ ] 5.1 `catalog/pages/product-detail-page.tsx`: N slot pickers when packUnits >= 2 (chips + resolveInStockVariantId; repeats while stock allows). [vitest, manual] (M)
- [ ] 5.2 Same file: all-or-nothing gating, insufficient-stock state, pack total + badge. [vitest] (M)
- [ ] 5.3 Same file: collapse slots → Map<variantId, qty>; addItem() per entry (upsert adds qty). [vitest, manual] (M)
- [ ] 5.4 Extend `catalog/pages/__tests__/product-detail-page.test.tsx`: N slots, disabled until complete, repeats collapse, OOS blocks. [vitest] (S)

## Phase 6: Cart Grouping (PR 6)

- [ ] 6.1 `cart/api/queries.ts` product join (~L97-102) + mapping: add pack_units. [type-check, vitest] (S)
- [ ] 6.2 `cart-item-row.tsx` + `cart-sidebar.tsx`: Pack xN badge + splitPackPrice rows + group total (DB + local). [vitest render] (M)
- [ ] 6.3 `cart/pages/cart-page.tsx`: grouped rows, group total = products.price (collapsed qty exact). [vitest, manual] (S)
- [ ] 6.4 New `cart/__tests__/cart-grouping.test.tsx`: $10,000 x3 → exact split; non-pack regression. [vitest] (S)

## Phase 7: Admin Sales (PR 7)

- [ ] 7.1 `admin/sales/pages/InPersonSalesPage.tsx` VariantPickerDialog (~L421): N pack slots, confirm → N SaleItems (splitPackPrice); total = pack price. [manual E2E] (M)
- [ ] 7.2 Manual: insufficient stock → BEFORE trigger rejects atomically, no partial decrement. [manual] (S)
- [ ] 7.3 `admin/orders/api/use-order-queries.ts` createAdminOrder: exclude pack products; block message. [manual, non-pack regression] (S)

## Phase 8: Verification (all PRs)

- [ ] 8.1 Regression: non-pack cart/checkout/in-person unchanged (spec: single-product flows). [`pnpm --filter web test`, `pnpm type-check`, `pnpm lint`, manual] (S)
