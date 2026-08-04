# Archive Report — Auto SKU Generation

> **Change**: `auto-sku-generation` | **Project**: m-b-casual | **Archived**: 2026-08-02
> **Delivery**: force-chained · stacked-to-main · PRs #1–#4 (code) + #5 (OpenSpec deltas, completed during archive)
> **Verdict**: PASS WITH WARNINGS (2 WARNINGs, 3 SUGGESTIONs — all spec-internal, no runtime failures)

## Summary

Auto-generate unique, deterministic SKUs for product variants at creation time. SKUs are 100% machine-generated via a shared `generateSku` util (`packages/shared/src/utils/sku.ts`) with a Postgres `BEFORE INSERT OR UPDATE` trigger as a defense-in-depth fallback. Manual SKU entry has been removed from all admin forms (web + mobile); `updateProduct` was reformed from delete+reinsert to upsert-by-variant (`onConflict: 'id'`) so existing SKUs survive every product edit. TS↔SQL SKU generation is **parity-correct** for all test inputs.

## Final SKU Format

```
{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3?}-{NNN}
```

**Example**: `mujer-camisa-oversize-M-BLA-001`

| Token | Derivation | Example | Notes |
|-------|-----------|---------|-------|
| `CAT_SLUG` | `categories.slug` via `generateSlug` (diacritics stripped) | `mujer` | idempotent on clean DB slugs |
| `PRODUCT_SLUG` | `products.slug` via `generateSlug` (diacritics stripped) | `camisa-oversize` | idempotent on clean DB slugs |
| `SIZE` | `slugifyToken(size).toUpperCase()`; null/empty→`UNI`; `Único`/`Única`→`UNI` | `S`, `UNI` | NFD diacritic-strip for Único/Única recognition |
| `COLOR3` | `truncateToken(slugifyToken(color),3).toUpperCase()`; omitted if null/empty | `BLA` (Blanco), `ÍND` (Índigo) | diacritics **preserved** (Unicode `\p{L}\p{N}`) |
| `NNN` | 1-based ordinal, `padStart(3,'0')` | `001` | collision-safe via `used` Set + `MAX_RETRY_ATTEMPTS=100` cap |

---

## Files Changed (17 total: 4 new, 13 modified)

### PR #1 — Phase 1: Shared SKU Generator + Validators + Unit Tests (~200 lines)

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/utils/sku.ts` | **Created** | `generateSku`, `slugifyToken`, `truncateToken`, `GenerateSkuParams`, `MAX_RETRY_ATTEMPTS` |
| `packages/shared/src/utils/index.ts` | Modified | Export `generateSku, slugifyToken, truncateToken, MAX_RETRY_ATTEMPTS` |
| `packages/shared/src/validators/product.ts` | Modified | `skuStringSchema` (max 100 + ASCII regex), `productVariantCreateSchema` (id?, size?, color?, discount?, stock, sku?) |
| `packages/shared/src/validators/index.ts` | Modified | Barrel re-exports |
| `packages/web/src/test/utils/sku.test.ts` | **Created** | 32 unit tests (format, determinism, fallbacks, diacritics, collision, 100-cap) |

### PR #2 — Phase 2: DB Trigger Fallback + 00000 Reconcile (~70 lines)

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/00002_sku_autofill_trigger.sql` | **Created** | `variant_sku_base` + `gen_variant_sku` (100-cap) + `trg_variant_sku_autofill` (BEFORE INSERT/UPDATE WHEN NEW.sku IS NULL) + `ROW_NUMBER()` CTE backfill + DROP guards |
| `supabase/migrations/00000_full_database.sql` | Modified | Reconciled trigger functions (§5.18–5.20) + trigger (§6.11) for fresh-env parity |

### PR #3 — Phase 3: Web Admin Mutations + UI (~65 lines, stacked-to-main)

| File | Action | Description |
|------|--------|-------------|
| `packages/web/src/features/admin/products/api/use-product-mutations.ts` | Modified | `createProduct`: fetch `categories.slug`, `generateSku` per variant with `used` Set + `ordinal = index+1`; `updateProduct`: upsert-by-variant (`onConflict:'id'`), preserve existing SKUs from DB, delete orphans by id |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` | Modified | Variant schema: added `id: z.string().uuid().optional()`, removed `sku`; defaultValues: added `id: v.id`, removed `sku` |
| `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | Modified | Removed `sku` from both create/update `.map()`; added `id: v.id` to update mapping |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | Modified | Removed SKU `<Input>` block + `register('variants.{i}.sku')` + `sku: ''` from `append()` |

### PR #4 — Phase 4: Mobile Admin Mutations + UI (~55 lines, stacked-to-main)

| File | Action | Description |
|------|--------|-------------|
| `packages/mobile/src/features/admin/api/use-admin-products.ts` | Modified | Same create (generateSku + `used` Set) + update (upsert-by-variant, preserve SKUs, delete orphans) reform as web; `id` added to update input, `sku` removed |
| `packages/mobile/src/app/(admin)/productos/[id].tsx` | Modified | Removed SKU `<TextInput>` block; variant state type `sku: string` → `id?: string`; `slugify` retained (name→slug auto-generation, not SKU) |

### PR #5 — Phase 5: OpenSpec Delta Specs (completed during archive)

| File | Action | Description |
|------|--------|-------------|
| `openspec/specs/sku-generation/spec.md` | **Created** | NEW domain main spec — SKU format, token derivation, validation, trigger SQL, API, data model, acceptance criteria |
| `openspec/specs/admin-catalog/spec.md` | Modified | Delta: SKU auto-generated, input removed from form, `updateProduct` → upsert-by-variant; acceptance criteria updated; `sku-generation` dependency added |
| `openspec/specs/database-schema/spec.md` | Modified | Delta: ADDED "SKU backfill trigger" requirement + scenarios; MODIFIED "Complete table schema" note (sku stays `text unique` nullable); acceptance criteria updated |
| `openspec/specs/shared-package/spec.md` | Modified | Delta: ADDED `skuStringSchema` + `productVariantCreateSchema` requirement; MODIFIED "Format utilities" to include `generateSku`; acceptance criteria updated |

---

## Test Results

| Check | Command | Result |
|-------|---------|--------|
| SKU unit tests | `pnpm --filter web test -- src/test/utils/sku.test.ts` | **32/32 PASS** (incl. 4 retry-cap tests) |
| Full web suite | `pnpm --filter web test` | **159/159 PASS** (12 files) |
| Type-check — web | `pnpm --filter web type-check` | **exit 0** (zero errors) |
| Type-check — shared | `pnpm --filter shared type-check` | **exit 0** (zero errors) |
| Type-check — mobile | `pnpm --filter mobile type-check` | **exit 0** (zero errors) |
| TS ↔ SQL parity | Manual + simulated | **PASS** — identical SKU output for all test inputs |
| DB trigger validation | rollback-wrapped `execute_sql` on dev DB | PASS — NULL-SKU count invariant 35→35 (zero persistence) |

> The apply-progress (#289) claimed a pre-existing TS1005 error in `categories-list-page.test.tsx`. The verify report (#294) re-checked and confirms that file now **passes (5 tests)** and type-check is **fully clean** — strictly better than the claimed state.

---

## Warnings Carried (from Verify Report #294)

### WARNING W1 — `skuStringSchema` is ASCII-only (spec-internal inconsistency)
- **What**: The regex `skuStringSchema` uses ASCII-only character classes (`[a-z0-9]`, `[A-Z0-9]`, `[A-Z]{3}`, `\d`) without the `u` flag. It **rejects** SKUs containing diacritic color tokens (e.g. `hombre-pantalon-S-ÍND-001` → `false`).
- **Impact**: Latent — `skuStringSchema` is **not applied** to generated SKUs at any call site (only defined + exported in `validators/product.ts`). No runtime effect. But the spec mandates diacritic preservation (`Índigo → ÍND`) while the validation schema rejects it.
- **Resolution documented**: Added limitation note to `sku-generation/spec.md` (validation section) and `shared-package/spec.md`. **Open**: either add a Unicode-aware alternative schema or strip diacritics at generation time.
- **File**: `packages/shared/src/validators/product.ts:57–59`

### WARNING W2 — Spec scenario example drift (documented user override)
- **What**: Original spec scenario 2 showed `…-UNICO-001` (5-char SIZE token); user-approved override + implementation produce `UNI` (3-char). Also, scenario 1 used `camisa-oversize-blanca` (color in product slug) vs actual `camisa-oversize` with size `M`.
- **Resolution**: Reconciled in delta spec + all synced main specs. `Único`/`Única`/`UNICO` → `UNI` via NFD diacritic-strip in `deriveSizeToken`.

### SUGGESTION S1 — SQL trigger-raise message not byte-identical to TS throw
- TS: `SKU generation exceeded max retry attempts (100)` (sku.ts:148)
- SQL: `SKU generation exceeded max retry attempts (100) for product %` (00002:106)
- Functionally equivalent; cosmetic only.

### SUGGESTION S2 — Trigger WHEN clause omits `= ''` guard
- Uses `WHEN (NEW.sku IS NULL)` instead of `WHEN ((NEW.sku IS NULL) OR (NEW.sku = ''))`.
- Safe in practice (app never emits empty-string SKUs), but a direct DB insert with `sku = ''` would slip past.

### SUGGESTION S3 — cat/prod parity depends on "slugs are ASCII-clean" invariant
- TS `generateSku` uses `generateSlug` (strips diacritics); SQL uses `lower(c.slug)` (preserves diacritics). They match for all currently-produced data because slugs are sanitized at creation. If a raw diacritic slug were inserted directly, the cat/prod segment would diverge.

---

## Decisions Log

| # | Decision | Rationale | Evidence |
|---|----------|-----------|----------|
| D1 | **Shared TS util `generateSku` + DB trigger fallback** (Option B) | Guarantees web/mobile parity (R3); trigger is defense-in-depth, easier to unit-test | Design #285; Verify S1–S3 |
| D2 | **Full-slug format** `{CAT}-{PROD}-{SIZE}-{COLOR3?}-{NNN}` | Self-documenting, no abbreviation table, unique-by-construction (products.slug globally unique) | Design #285; Explore #283 (Option B > A) |
| D3 | **`Único`/`Única`/`UNICO` → `UNI` (3-char)** | User override superseded original spec scenario 2 (`UNICO`, 5-char) | Verify W2; Apply #289; sku.ts:40–57 |
| D4 | **Diacritics PRESERVED in COLOR3** (Ìndigo→ÍND) | Design decision: color identity kept; `slugifyToken` uses `\p{L}\p{N}` | Verify V9 table L108–L115; Design #285 |
| D5 | **`updateProduct` = upsert by `id`** (`onConflict: 'id'`) | Preserves existing SKUs (R1 mitigation); maintains FK integrity | Design #285; Apply #289 |
| D6 | **No manual SKU entry** — removed from all forms | Eliminates SKU collision/format risk; `sku text unique` is the final guard | Proposal R4; Verify S12 |
| D7 | **New migration `00002`** + 00000 reconcile | Follows `00001` incremental convention; both dev paths converge | Design #285; Apply #289 |
| D8 | **Backfill via `ROW_NUMBER()` CTE** (not per-row `gen_variant_sku()`) | Postgres statement snapshots can't see own writes → per-row existence check would cause duplicate SKUs | Apply #289; Arch #292 |
| D9 | **3-function SQL split** (`variant_sku_base` + `gen_variant_sku` + `trg_variant_sku_autofill`) | Decouples reusable base-builder; gives Postgres a proper trigger fn; keeps `gen_variant_sku(p_product_id,size,color)` callable | Arch #292 |
| D10 | **Trigger `BEFORE INSERT OR UPDATE WHEN (NEW.sku IS NULL)`** | INSERT-only would fail on UPDATE that sets size/color; WHEN-guard preserves existing SKUs on edit | Arch #292 |
| D11 | **100-retry cap in BOTH SQL and TS** | Symmetry prevents divergent failure behavior; identical exception message (modulo S1 suffix) | Arch #292; sku.ts:84,148 |
| D12 | **Caller owns `used` Set** — `generateSku` does NOT mutate it | Explicit mutation contract; caller does `used.add(sku)` after each generation | sku.ts:114–116; Apply #289 |
| D13 | **Fixed bug: `úncia` → `única`** typo in 00000 §5.18 IN-list | Would make fresh-env DBs emit `…-ÚNICA-…` instead of `…-UNI-…`, diverging from TS | Bugfix #291; re-validated |
| D14 | **Fixed bug: invalid `errcodemessage` RAISE option** in 00002 | Passes `CREATE FUNCTION` but errors at runtime when 100-cap fires; aligned to clean `raise exception` form | Bugfix #291 |

---

## Decisions by Risk Mitigation

| Risk (from Proposal #284) | Mitigation | Status |
|---|---|---|
| R1: `updateProduct` wipes SKUs | D5: upsert-by-variant | ✅ |
| R2: SKU collisions | D2: format + `used` Set + unique constraint | ✅ |
| R3: web/mobile divergence | D1: single shared util | ✅ |
| R4: seed format mismatch | Deferred (out of scope) | ⏸ |
| R5: free-text color noise | `slugifyToken` + `.slice(0,3)` | ✅ |

---

## Spec Warning Reconciliation Summary

| Warning | Resolution | Where |
|---|---|---|
| W1: ASCII-only `skuStringSchema` | Documented limitation note | `sku-generation/spec.md` (validation), `shared-package/spec.md` |
| W2: `UNICO` → `UNI` (scenario 2) | Updated all examples to `UNI` | delta spec + `sku-generation/spec.md` scenarios |
| W2: scenario 1 informal example | Updated to `camisa-oversize` + size `M` | delta spec + `sku-generation/spec.md` scenarios |
| S1: SQL vs TS message suffix | Documented as SUGGESTION (open) | `sku-generation/spec.md` limitation note |
| S2: trigger WHEN `= ''` guard | Documented as SUGGESTION (open) | `sku-generation/spec.md` migration notes |
| S3: slug ASCII-clean invariant | Documented as SUGGESTION (open) | `sku-generation/spec.md` V9 caveat + limitation note |

---

## Sources of Truth Updated

| Spec File | Action | Content |
|---|---|---|
| `openspec/specs/admin-catalog/spec.md` | Modified | MODIFIED "Variant management" requirement (SKU auto-gen, updateProduct upsert); 2 new scenarios; acceptance criteria + dependency updated |
| `openspec/specs/database-schema/spec.md` | Modified | ADDED "SKU backfill trigger" requirement + 2 scenarios; MODIFIED "Complete table schema" note; acceptance criteria updated |
| `openspec/specs/sku-generation/spec.md` | **Created** | New domain main spec — full SKU format, validation (with W1 limitation), data model, trigger SQL, API contracts, acceptance criteria |
| `openspec/specs/shared-package/spec.md` | Modified | ADDED "SKU validation schema" requirement; MODIFIED "Format utilities" (generateSku); acceptance criteria updated |

---

## Archive Contents

| Artifact | Status | Location |
|---|---|---|
| `exploration.md` | Archived | `openspec/changes/archive/2026-08-02-auto-sku-generation/exploration.md` |
| `proposal.md` | Archived | `openspec/changes/archive/2026-08-02-auto-sku-generation/proposal.md` |
| `spec.md` | Archived (reconciled) | `openspec/changes/archive/2026-08-02-auto-sku-generation/spec.md` |
| `design.md` | Archived | `openspec/changes/archive/2026-08-02-auto-sku-generation/design.md` |
| `tasks.md` | Archived (Phase 5 complete) | `openspec/changes/archive/2026-08-02-auto-sku-generation/tasks.md` |
| `apply-progress.md` | Archived (Phases 1–4 complete) | `openspec/changes/archive/2026-08-02-auto-sku-generation/apply-progress.md` |
| `verify-report.md` | Archived | `openspec/changes/archive/2026-08-02-auto-sku-generation/verify-report.md` |
| `archive-report.md` | This file | `openspec/changes/archive/2026-08-02-auto-sku-generation/archive-report.md` |

## Engram Observation IDs (Traceability)

| Artifact | Engram Observation ID | Topic Key |
|---|---|---|
| SDD Init state | #278 | `sdd-init/m-b-casual` |
| Exploration | #283 | `sdd/auto-sku-generation/explore` |
| Proposal | #284 | `sdd/auto-sku-generation/proposal` |
| Design | #285 | `sdd/auto-sku-generation/design` |
| Delta Spec | #286 | `sdd/auto-sku-generation/spec` |
| Tasks | #287 | `sdd/auto-sku-generation/tasks` |
| Apply Progress | #289 | `sdd/auto-sku-generation/apply-progress` |
| PR#2 Architecture | #292 | `sdd/auto-sku-generation/arch` |
| Bugfix (typo + RAISE) | #291 | `sdd/auto-sku-generation/bugfix-00002` |
| Verify Report | #294 | `sdd/auto-sku-generation/verify` |

## SDD Cycle Complete

The `auto-sku-generation` change has been fully explored, proposed, specified, designed, task-broken, implemented (PRs #1–#4), verified (32/32 + 159/159 + type-check clean + TS↔SQL parity), delta-synced into 4 main specs, spec warnings reconciled, and archived. Ready for the next change.
