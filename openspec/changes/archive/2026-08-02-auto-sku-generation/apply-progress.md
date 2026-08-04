# Apply Progress — Auto SKU Generation (PR #1 + PR #2 + PR #3)

- **Change**: `auto-sku-generation`  ·  **Project**: m-b-casual
- **Phase**: apply — PR #1 (Phase 1) complete; PR #2 (Phase 2) complete; PR #3 (Phase 3) complete
- **Mode**: Standard (strict_tdd: false, per `openspec/config.yaml` + session config)
- **Test runner**: `pnpm --filter web test` (vitest, via `@mbt/shared` alias → `packages/shared/src`)
- **Delivery**: auto-chain · stacked-to-main · PR #3 base = `main` (depends on PR #1)

## Goal

Implement a single, deterministic SKU derivation contract shared by the web/mobile
admin path (TS `generateSku`) and a DB-level fallback (PL/pgSQL trigger) so a variant
can never be persisted without a SKU, and both paths produce **identical** SKUs for
identical inputs. PR #1 = the TS util + validators + unit tests. PR #2 = the
PostgreSQL trigger + fresh-env reconciliation + retry-cap symmetry + validation.

## Tasks Status

| # | Task | File(s) | Status | Evidence |
|---|------|---------|--------|----------|
| 1.1 | `generateSku` + `slugifyToken` + `truncateToken` (import `generateSlug`) | `packages/shared/src/utils/sku.ts` | done | shared type-check exit 0 |
| 1.2 | Export utils | `packages/shared/src/utils/index.ts` | done | re-exported |
| 1.3 | `skuStringSchema` + `productVariantCreateSchema` w/ JSDoc | `packages/shared/src/validators/product.ts` | done | type-check exit 0 |
| 1.4 | Re-export validators | `packages/shared/src/validators/index.ts` | done | barrel updated |
| 1.5 | Unit tests | `packages/web/src/test/utils/sku.test.ts` | done | 28/28 pass |
| 2.1 | 00002 migration: `variant_sku_base` + `gen_variant_sku` (100 cap) + `trg_variant_sku_autofill` + CTE backfill + DROP guards | `supabase/migrations/00002_sku_autofill_trigger.sql` | done | full DDL compiled & ran on linked dev DB (rollback tx); trigger fills NULL sku; parity asserted |
| 2.2 | Reconcile fn+trigger into 00000 §5.18-5.20 + §6.11 (fresh-env parity) | `supabase/migrations/00000_full_database.sql` | done | read back; logic identical to 0002; §5.18 typo fixed |
| 2.3 | 100-retry cap on `generateSku` (mirrors DB trigger) | `packages/shared/src/utils/sku.ts`, `utils/index.ts` | done | `MAX_RETRY_ATTEMPTS=100` exported; +4 cap tests; 32/32 |
  | 2.4 | Validate PR #2 | — | done | rollback `execute_sql` on dev (parity/trigger/100-cap/rollback-invariance); TS 32/32; shared tsc exit 0 |
| 3.1 | `use-product-mutations.ts`: import `generateSku`; `createProduct` fetches category slug + generates SKU per variant (with `used` set); `updateProduct` → upsert-by-variant (`onConflict:'id'`) preserving existing SKUs, delete orphans by id | `packages/web/src/features/admin/products/api/use-product-mutations.ts` | done | type-check clean; test suite 154/154 pass |
| 3.2 | `ProductForm.tsx`: add `id?: z.string().uuid()` to variant schema; remove `sku`; add `id` to defaultValues | `packages/web/src/features/admin/products/components/ProductForm.tsx` | done | schema + defaultValues updated |
| 3.3 | `ProductFormPage.tsx`: drop `sku` from both `.map()`; pass `id: v.id` in update mapping | `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | done | create mapping omits `id` (not in `CreateProductInput`) |
| 3.4 | `VariantManager.tsx`: remove SKU `<Input>` block + `sku: ''` from `append()` | `packages/web/src/features/admin/products/components/VariantManager.tsx` | done | SKU input fully removed from UI |

Phase 1 + Phase 2 + Phase 3 complete. Phases 4–5 remain pending (PR #4–5).

## Files Changed

| File | PR | Action | What |
|------|----|--------|------|
| `packages/shared/src/utils/sku.ts` | 1 | created | `generateSku`, `slugifyToken`, `truncateToken`, `GenerateSkuParams` |
| `packages/shared/src/utils/sku.ts` | 2 | modified | added `MAX_RETRY_ATTEMPTS=100` + 100-cap collision loop |
| `packages/shared/src/utils/index.ts` | 2 | modified | export `MAX_RETRY_ATTEMPTS` |
| `packages/shared/src/validators/product.ts` | 1 | modified | `skuStringSchema`, `productVariantCreateSchema` |
| `packages/shared/src/validators/index.ts` | 1 | modified | barrel re-exports |
| `packages/web/src/test/utils/sku.test.ts` | 1+2 | created | 32 tests incl. 4 retry-cap tests (added in PR #2) |
| `supabase/migrations/00002_sku_autofill_trigger.sql` | 2 | created | `variant_sku_base` + `gen_variant_sku` + `trg_variant_sku_autofill` + CTE backfill + DROP guards |
| `packages/web/src/features/admin/products/api/use-product-mutations.ts` | 3 | modified | `createProduct` now fetches `categories.slug`, generates SKU per variant via `generateSku` with a shared `used` set for batch collisions; `updateProduct` reformed from delete+reinsert to `upsert({ onConflict: 'id' })` preserving existing SKUs + orphan deletion by id |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` | 3 | modified | variant schema: added `id: z.string().uuid().optional()`, removed `sku: z.string().optional()`; defaultValues variant map: added `id: v.id`, removed `sku: v.sku ?? ''` |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | 3 | modified | removed SKU `<Input>` block + `register('variants.{i}.sku')` + `sku: ''` from `append()`; updated docstring |
| `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | 3 | modified | removed `sku: v.sku \|\| null` from both create/update variant `.map()`; added `id: v.id` to update mapping for upsert matching |

## Verification

PR #1:
- `pnpm --filter web test src/test/utils/sku.test.ts` → 28/28 pass (now 32/32 with PR #2 cap tests).
- `pnpm --filter @mbt/shared type-check` → exit 0.
- Full web suite 150/150 (1 pre-existing broken untracked `categories-list-page.test.tsx`, untouched).

PR #2:
- `supabase db push --dry-run` / `supabase db lint` **unavailable** (no `supabase link` → "Cannot find project ref"; no local Docker stack). Fell back to rollback-wrapped execution on the linked dev DB (stronger than syntax-only).
- **Full `00002` DDL** (DROP guards → 3 functions → trigger → CTE backfill) executed in one transaction; `rollback` left NULL-SKU count invariant (**35 → 35**) → zero persistence. Script raised **no SQL error** → file is valid PL/pgSQL.
- **Parity (TS ↔ SQL)** on dev (all rollback-wrapped):
  - `gen_variant_sku(pid,'Única',null)` → `…-UNI-…`; `gen_variant_sku(pid,'Único',null)` → `…-UNI-…`; `gen_variant_sku(pid,'S',null)` → `…-S-…`
  - `variant_sku_base(pid,'Ñandú','Azul')` → `…-ÑANDÚ-AZU` (diacritics `Ñ`/`ú` **preserved**)
  - Trigger: `INSERT … sku=NULL` → trigger fills via `gen_variant_sku` (verified `RETURNING sku`)
  - 100-cap: SQL `raise exception 'SKU generation exceeded max retry attempts (100)…'` + TS `throw new Error(…100…)` — **identical message**

PR #3 (web admin):
- `pnpm --filter web test` → 154/154 pass (1 pre-existing broken untracked `categories-list-page.test.tsx` suite — syntax error in `vi.mock` factory at line 25, untouched, predates session).
- `pnpm --filter web type-check` → exit 0 for all modified PR #3 files (the only TS error is the pre-existing `categories-list-page.test.tsx(25,4): error TS1005`; no errors in `use-product-mutations.ts`, `ProductForm.tsx`, `ProductFormPage.tsx`, `VariantManager.tsx`).
- `sku.test.ts` → 32/32 pass (unchanged from PR #1+2; verify regression).

## Key Decisions & Deviations

- **Backfill via `ROW_NUMBER()` CTE, not per-row `gen_variant_sku()`**: a single `UPDATE` runs in one statement snapshot that can't see its own in-progress writes, so the in-function `exists` check would miss siblings filled in the same statement and emit DUPLICATE SKUs (unique-constraint violation). The CTE assigns distinct, deterministic ordinals from pre-update state; `variant_sku_base()` is shared by backfill + trigger → identical bases.
- **3-function split** (`variant_sku_base` + `gen_variant_sku` + `trg_variant_sku_autofill`): decouples the reusable base-builder; gives Postgres a proper trigger fn while keeping `gen_variant_sku(p_product_id,size,color)` callable (matches spec signature).
- **Trigger is `BEFORE INSERT OR UPDATE WHEN (NEW.sku IS NULL)`**, not INSERT-only (tasks.md 2.1 sketch). WHEN-false preserves existing SKUs on edit (scenario 4); OR-UPDATE also fills NULLs set later. Deviation from the 2.1 sketch, documented.
- **Cap = 100 in both SQL and TS** with identical exception message (symmetry).
- **Diacritics preserved** via `[[:alnum:]]` (Unicode-aware) in SQL and `\p{L}\p{N}` in TS (`slugifyToken`); `Único/Única → UNI` via IN-list (SQL) vs NFD-strip (TS). cat/prod slugs use `generateSlug` (strips diacritics) — DB slugs pre-sanitized at creation, so SQL `lower()` is idempotent and matches TS.

## Issues Found

- **BUG — FIXED (this session)**: `00000_full_database.sql` §5.18 `variant_sku_base` had `'úncia'` (ç) instead of `'única'` (c) in the Único/Única IN-list — copy-pasted from typo'd test DDL. Inert in dev tests (which exercised `Único`, not `Única`) but would make fresh-env DBs emit `…-ÚNICA-…` instead of `…-UNI-…`, diverging from `generateSku`. Fixed; re-validated `Única → UNI`.
- **BUG — FIXED (this session)**: `00002` `gen_variant_sku` `raise` used `using errcodemessage = 'SKU_GEN_MAX_RETRIES'` — `errcodemessage` is not a valid PL/pgSQL RAISE option (passes `CREATE`, errors at runtime when the cap fires); `00000` §5.19 already had the clean form. Aligned `00002` to the clean `raise exception '…', p_product_id;`.
- **Pre-existing (NOT this PR)**: `packages/web/src/.../categories-list-page.test.tsx` — malformed `vi.mock` factory (TS1005/vitest parse), untracked, predates this session. Untouched.
- **Spec/schema tension (PR #1, noted, not fixed)**: `skuStringSchema` ASCII `[A-Z]{3}` cannot validate diacritic color tokens (e.g. `…-ÍND-…`). `generateSku` preserves diacritics per acceptance examples. Flagged for maintainer reconciliation.

## Remaining Tasks

- [x] 4.1–4.2 Mobile admin mutations + UI (PR #4) — COMPLETE (see verify report #294)
- [x] 5.1–5.4 OpenSpec delta updates (PR #5) — COMPLETE (during archive phase)
- [x] 5.5 Spec warning reconciliation (UNICO→UNI, ASCII-only note) — COMPLETE (during archive phase)

## Workload / PR Boundary

- Mode: PR #3 slice (Phase 3 only) — `auto-chain`, `stacked-to-main`, base = `main` (depends on PR #1 for `generateSku`).
- Boundary: starts from `main` (with PR #1 merged containing `generateSku`); ends after web admin mutation reform + UI SKU removal are verified by tests + type-check.
- Estimated review budget impact: well under 400 lines (~166 net change across 4 files). No `size:exception`.
- Note: PR #3 is stacked-to-main (not on top of PR #2), per the dependency graph — it depends on the shared util, not the DB trigger.
