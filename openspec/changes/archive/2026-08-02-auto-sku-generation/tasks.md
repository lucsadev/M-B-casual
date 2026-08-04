# Tasks: Auto SKU Generation

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~414 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (shared util + validators + tests) → PR 2 (DB trigger) → PR 3 (web admin) → PR 4 (mobile admin) → PR 5 (openspec deltas) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Est. lines | Notes |
|---|---|---|---|---|
| 1 | Shared `generateSku` util + validators + unit tests | PR 1 | ~200 | Base = main; self-contained, testable via `pnpm --filter web test` |
| 2 | DB trigger migration + 00000 schema reconcile | PR 2 | ~70 | Base = main; independent of PR 1 |
| 3 | Web admin mutations + UI (form/validator/VariantManager) | PR 3 | ~65 | Base = main; depends on PR 1 (shared util) |
| 4 | Mobile admin mutations + UI | PR 4 | ~55 | Base = main; depends on PR 1 (shared util) |
| 5 | OpenSpec delta specs | PR 5 | ~30 | Base = main; independent |

## Design Notes (resolved before apply)

- **COLOR3 omission**: spec says omit COLOR3 segment when color is null/empty (e.g. `mujer-cinto-cuero-negro-UNICO-001`); design draft suggested `GEN` fallback. Tasks follow the **spec** — the `skuStringSchema` regex `(?:-[A-Z]{3})?` confirms COLOR3 is optional.
- **API shape**: spec interface uses `ordinal: number`; design adds `used?: ReadonlySet<string>` for batch collision. Tasks implement **both** — `ordinal` required (per spec), `used` optional (per design) for per-batch uniqueness.
- **ProductForm.tsx**: the design table lists this file for schema changes (not just ProductFormPage.tsx). Both need `sku` removed and variant `id` pass-through added.

## Phase 1: Foundation — Shared SKU Generator + Validators + Unit Tests (PR #1)

- [x] 1.1 Create `packages/shared/src/utils/sku.ts` — `slugify` helper + `generateSku({categorySlug, productSlug, size?, color?, ordinal, used?})` returning `{CAT}-{PROD}-{SIZE}-{COLOR3?}-{NNN}`; import `generateSlug` from `format.ts`
- [x] 1.2 Modify `packages/shared/src/utils/index.ts` — add `export { generateSku, slugifyToken, truncateToken } from './sku.ts'`
- [x] 1.3 Modify `packages/shared/src/validators/product.ts` — add `skuStringSchema` (max 100 + regex) and `productVariantCreateSchema` (id?, size?, color?, discount?, stock, sku?) with JSDoc
- [x] 1.4 Modify `packages/shared/src/validators/index.ts` — add `export { skuStringSchema, productVariantCreateSchema } from './product.ts'`
- [x] 1.5 Create `packages/web/src/test/utils/sku.test.ts` — test: deterministic format, color-less omission, duplicate ordinal increment, size null→UNI, diacritics preserved (Índigo→ÍND), batch collision via `used` set

## Phase 2: Database — SKU Trigger Fallback (PR #2) ✅ complete

- [x] 2.1 Create `supabase/migrations/00002_sku_autofill_trigger.sql` — `variant_sku_base()` + `gen_variant_sku()` (100-retry cap) + `trg_variant_sku_autofill()` BEFORE INSERT OR UPDATE trigger (WHEN NEW.sku IS NULL) + one-time `ROW_NUMBER()` CTE backfill + DROP guards (idempotent)
- [x] 2.2 Reconcile into `supabase/migrations/00000_full_database.sql` — `variant_sku_base` (§5.18), `gen_variant_sku` (§5.19), `trg_variant_sku_autofill` fn (§5.20), trigger (§6.11) for fresh-env parity
- [x] 2.3 Apply 100-retry cap to shared `generateSku` — `MAX_RETRY_ATTEMPTS=100` in `packages/shared/src/utils/sku.ts`, exported via `utils/index.ts`, +4 cap tests (mirrors DB trigger limit) [orchestrator-scoped T2.3]
- [x] 2.4 Validate PR #2 — rollback-wrapped `execute_sql` on linked dev DB (parity, trigger, collision, 100-cap, rollback-invariance) + TS 32/32 + shared type-check exit 0; fixed §5.18 `'úncia'→'única'` typo + `00002` `using errcodemessage` bug, re-validated [orchestrator-scoped T2.4]

## Phase 3: Integration — Web Admin (PR #3)

- [x] 3.1 Modify `packages/web/src/features/admin/products/api/use-product-mutations.ts` — import `generateSku`; in `createProduct` fetch category+product slugs and generate SKU per variant; in `updateProduct` replace delete+reinsert with upsert-by-variant (`onConflict: 'id'`) preserving existing SKUs; delete orphans by id
- [x] 3.2 Modify `packages/web/src/features/admin/products/components/ProductForm.tsx` — add `id?: z.string().uuid()` to inline variant schema; remove `sku` from schema; add `id` to defaultValues variant map; remove `sku: v.sku ?? ''`
- [x] 3.3 Modify `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` — drop `sku: v.sku || null` from both create and update `.map()`; pass through `id: v.id` for upsert matching
- [x] 3.4 Modify `packages/web/src/features/admin/products/components/VariantManager.tsx` — remove SKU `<Input>` block (lines 80-87) and `sku: ''` from `append()` default

## Phase 4: Integration — Mobile Admin (PR #4)

- [x] 4.1 Modify `packages/mobile/src/features/admin/api/use-admin-products.ts` — same create (generateSku) + update (upsert-by-variant, delete orphans) reform as web; resolve category/product slugs via select or join
- [x] 4.2 Modify `packages/mobile/src/app/(admin)/productos/[id].tsx` — remove SKU `<TextInput>` block (lines 289-294); remove `sku` from variant state type, `addVariant`, `updateVariant`, `handleSave`, `useEffect`; delete local `slugify` (line 15) if no longer used

## Phase 5: Documentation — OpenSpec Delta Updates (PR #5)

- [x] 5.1 Update `openspec/specs/admin-catalog/spec.md` — delta: SKU auto-generated on variant create, no manual input, `updateProduct` preserves SKUs via upsert-by-variant; acceptance criteria updated; `sku-generation` added as dependency
- [x] 5.2 Update `openspec/specs/database-schema/spec.md` — delta: `BEFORE INSERT OR UPDATE` trigger backfills NULL SKU, one-time backfill UPDATE via CTE, `sku text unique` unchanged
- [x] 5.3 Create `openspec/specs/sku-generation/spec.md` (NEW domain) — full SKU format, token derivation, validation, trigger SQL, API, data model, acceptance criteria
- [x] 5.4 Update `openspec/specs/shared-package/spec.md` — delta: added `productVariantCreateSchema` + `skuStringSchema` requirement, extended `generateSku` to `Format utilities`, barrel exports; acceptance criteria updated
- [x] 5.5 Reconcile spec warnings from verify report — W2: `UNICO` → `UNI` (user override); W1: ASCII-only `skuStringSchema` limitation documented in delta spec + sku-generation main spec
- [x] 5.6 Archive change folder → `openspec/changes/archive/2026-08-02-auto-sku-generation/`

## Dependency Graph

```
Phase 1 (shared util + validators + tests)  — PR 1
  ├── Phase 3 (web admin)                    — PR 3 (depends on PR 1)
  ├── Phase 4 (mobile admin)                 — PR 4 (depends on PR 1)
  └── Phase 2 (DB trigger)                   — PR 2 (independent)

Phase 5 (openspec deltas)                    — PR 5 (independent)
```
