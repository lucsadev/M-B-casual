# Verification Report — Auto SKU Generation

**Change:** `auto-sku-generation` (chained PRs #1–#4 complete; PR #5 openspec deltas pending)
**Mode:** standard verify (strict_tdd: **false**)
**Test runner:** `pnpm --filter web test` (vitest); type-check via `pnpm --filter <pkg> type-check` (tsc --noEmit)
**TypeScript:** 5.8 strict

## Executive Summary

Implementation matches spec + design across all four layers (shared util, web, mobile, DB trigger). Static analysis is **clean** (exit 0 across web/shared/mobile). Dynamic tests **pass** (32/32 SKU unit tests; 159/159 full web suite). TS↔SQL SKU generation is **parity-correct** for all spec/test inputs. Remaining findings are **2 WARNINGs** (one spec-internal inconsistency, one documented spec-example drift) and **3 SUGGESTIONs** (cosmetic). **Verdict: PASS WITH WARNINGS.** No CRITICAL issues.

## Completeness

| Phase | PR | Tasks | Status | Evidence |
|-------|----|-------|--------|----------|
| Phase 1 | #1 | shared `generateSku` util + validators + unit tests | ✅ COMPLETE | `packages/shared/src/utils/sku.ts` (157 lines); `sku.test.ts` 32/32 |
| Phase 2 | #2 | DB trigger fallback + 00000 reconcile + 100-cap + backfill | ✅ COMPLETE | `00002_sku_autofill_trigger.sql` (165 lines); `00000_full_database.sql` §5.18–5.20, §6.11 |
| Phase 3 | #3 | web admin mutations + UI | ✅ COMPLETE | `use-product-mutations.ts`, `VariantManager.tsx`, `ProductForm.tsx`, `ProductFormPage.tsx` |
| Phase 4 | #4 | mobile admin mutations + UI | ✅ COMPLETE | `use-admin-products.ts`, `productos/[id].tsx` |
| Phase 5 | #5 | openspec delta specs (R4 seed-alignment) | ⏸ PENDING (docs only, no code) | `tasks.md` Phase 5 — deferred by design |

**Code tasks: 14/14 complete. 1 doc-only task pending (out of code scope).**

## Build / Tests / Coverage Evidence

| Check | Command | Result |
|-------|---------|--------|
| SKU unit tests | `pnpm --filter web test -- src/test/utils/sku.test.ts` | **32/32 PASS** (8ms) |
| Full web suite | `pnpm --filter web test` | **159/159 PASS** (12 files) |
| Type-check — web | `pnpm --filter web type-check` | **exit 0** (zero errors) |
| Type-check — shared | `pnpm --filter shared type-check` | **exit 0** (zero errors) |
| Type-check — mobile | `pnpm --filter mobile type-check` | **exit 0** (zero errors) |

> Note: apply-progress #289 claimed a "pre-existing `categories-list-page.test.tsx(25,4): error TS1005`". Re-check shows that file now **passes (5 tests)** and type-check is **fully clean** — the error is not present in the current tree. (Strictly better than claimed state.)

### Unit-test coverage map (sku.test.ts, 32 tests)

| Spec scenario / behavior | Test(s) | Covered |
|---|---|---|
| Basic generation (all fields) | L5–L15 | ✅ |
| Determinism (identical inputs) | L17–L26 | ✅ |
| Explicit ordinal | L28–L37 | ✅ |
| Color-less variant — omits COLOR3 (null/undefined/empty) | L40–L71 | ✅ |
| Único → UNI / Única → UNI / null size → UNI | L74–L114 | ✅ |
| Ordinal padding (001 / 010 / 999) | L127–L160 | ✅ |
| Collision avoidance via `used` Set (increment / multi-increment / no-collision) | L162–L201 | ✅ |
| Cap at 100 (`MAX_RETRY_ATTEMPTS` constant) | L222–L224 | ✅ |
| Exact 100 collisions → succeeds (returns 101) | L231–L235 | ✅ |
| >100 collisions → throws `SKU generation exceeded max retry attempts (100)` | L237–L243 | ✅ |
| Color truncation to 3 chars (Marfil→MAR, Índigo→ÍND, multi-word→first 3) | L246–L278 | ✅ |
| `slugifyToken` (lower, hyphen, diacritics preserved, trim) | L282–L303 | ✅ |
| `truncateToken` (default 3, custom len, short passthrough) | L306–L317 | ✅ |

## Spec Compliance Matrix

| # | Spec requirement (from #286) | Implementation | Status |
|---|---|---|---|
| S1 | SKU format `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3?}-{NNN}` | sku.ts:137 `base = ${cat}-${prod}-${sizeTok}${colorSegment}` + `:140` ordinal suffix | ✅ |
| S2 | CAT/PROD slugified verbatim from DB slugs (idempotent) | sku.ts:131–132 `generateSlug(categorySlug/productSlug)` | ✅ |
| S3 | SIZE = slugified + UPPER; null/empty → UNI; Único/Única → UNI | sku.ts:40–57 `deriveSizeToken` (NFD diacritic strip + compare) | ✅ |
| S4 | COLOR3 = 3-char slugified + UPPER; omitted when null/empty | sku.ts:64–69 `deriveColorToken` (returns '' → `colorSegment=''`) | ✅ |
| S5 | NNN = 3-digit zero-padded ordinal | sku.ts:74 `padOrdinal` via `padStart(3,'0')` | ✅ |
| S6 | `generateSku({ categorySlug, productSlug, size?, color?, ordinal, used? })` | sku.ts:86–99 `GenerateSkuParams` (has both `ordinal` + `used?`) | ✅ |
| S7 | `productVariantCreateSchema` with `sku?: string` optional | validators/product.ts:68–75 (`sku: z.string().optional()`) | ✅ |
| S8 | Exports via utils/index.ts + validators/index.ts | utils/index.ts:2; validators/index.ts:5–6 | ✅ |
| S9 | BEFORE INSERT/OR UPDATE trigger backfills NULL sku | 00002:135–139; 00000 §6.11:1084–1088 (`before insert or update … when (NEW.sku is null)`) | ✅ |
| S10 | One-time backfill for existing NULL rows (window fn ordinal) | 00002:154–165 CTE `row_number() over (partition by product_id order by id)` | ✅ |
| S11 | MAX_RETRY_ATTEMPTS = 100 cap (TS + SQL) | sku.ts:84; 00002:105–106 (`if v_attempts > 100`) | ✅ |
| S12 | Admin UI: SKU input hidden; SKU omitted from form schema/defaults | VariantManager.tsx (no sku input); ProductForm.tsx:44–52 schema (no sku); ProductForm.tsx:99–106 defaults (no sku); ProductFormPage.tsx:52–77 (no sku) | ✅ |
| S13 | updateProduct: upsert-by-variant, preserve existing SKUs, orphan delete | use-product-mutations.ts:202–258; use-admin-products.ts:263–320 | ✅ |
| S14 | createProduct: fetch category.slug, generateSku per variant w/ `used` set; caller `used.add(sku)` | use-product-mutations.ts:51–89; use-admin-products.ts:124–169 | ✅ |
| S15 | Scn (1) New variant → `mujer-camisa-oversize-M-BLA-001` | sku.test.ts:6–14 ✅ |
| S16 | Scn (2) Color-less / Único → UNI, omit COLOR3 | sku.test.ts:40–49 (`mujer-cinto-cuero-UNI-001`) ✅ |
| S17 | Scn (3) Duplicate size×color → `-002` ordinal | sku.test.ts:162–201 (collision → 002/004) ✅ |
| S18 | Scn (4) Edit preserves existing SKU | use-product-mutations.ts:203–214 (id present → `existingSkuMap.get(v.id) ?? null`) ✅ |
| S19 | Scn (5) DB trigger backfills NULL on insert | 00002:123–133 `trg_variant_sku_autofill`; 00002:154–165 backfill ✅ |

## Correctness Table (code vs spec)

| Artifact | Spec contract | Actual | OK |
|---|---|---|---|
| `sku.ts:128–157` `generateSku` signature | `{categorySlug, productSlug, size?, color?, ordinal, used?}` | `GenerateSkuParams` has all 6 (ordinal required, used optional) | ✅ |
| `sku.ts:84` cap | `MAX_RETRY_ATTEMPTS = 100` | `export const MAX_RETRY_ATTEMPTS = 100`; throws `exceeded max retry attempts (100)` | ✅ |
| `sku.ts:131` cat/prod | `generateSlug` (idempotent on clean slugs) | reuses `generateSlug` from format.ts:42 | ✅ |
| `sku.ts:40` size derive | Único/Única → UNI | NFD strip + lowercase compare → 'unico'/'unica' → UNI | ✅ |
| `product.ts:57–59` `skuStringSchema` | `.max(100).regex(...)` per spec | regex exact — but ASCII-only character classes | ⚠️ (see Warnings) |

## Design Coherence Table

| Design decision (#285 / #287 / #292) | Implemented as decided? | Evidence |
|---|---|---|
| Shared TS util + DB trigger fallback | ✅ Option B | sku.ts + 00002 |
| SKU format `{CAT}-{PROD}-{SIZE}-{COLOR3?}-{NNN}` | ✅ | sku.ts:137,140 |
| Único/Única → UNI override (per user examples, supersedes spec scenario 2) | ✅ documented in tasks #287 | deriveSizeToken NFD; test L75–L94 |
| COLOR3 diacritics PRESERVED (Índigo→ÍND) | ✅ | slugifyToken `\p{L}\p{N}`; test L258–L267 |
| cat/prod diacritics STRIPPED (generateSlug, ASCII `\w`) | ✅ matches design | format.ts:46 `[^\w\s-]`; SQL `lower()` |
| updateProduct = upsert by `id`, `onConflict:'id'` | ✅ | use-product-mutations.ts:243 |
| existing SKUs read from DB → passed through unchanged | ✅ (not from form) | use-product-mutations.ts:182–194,212 |
| caller owns `used` set; `used.add(sku)` after each gen | ✅ | use-product-mutations.ts:83,226; use-admin-products.ts:154,287 |
| 3-fn SQL split (variant_sku_base / gen_variant_sku / trg wrapper) | ✅ | 00002:37,82,123; 00000 §5.18–5.20 |
| backfill via `ROW_NUMBER()` CTE (NOT per-row gen_variant_sku) | ✅ | 00002:154–165; rationale #292 |
| trigger `BEFORE INSERT OR UPDATE WHEN (NEW.sku IS NULL)` | ✅ (WHEN omits `= ''`, see Suggestions) | 00002:135–139 |
| 100-cap symmetry (SQL + TS) | ✅ | sku.ts:84; 00002:105–106 |
| fresh-env reconcile in 00000 | ✅ functions §5.18–5.20 + trigger §6.11 (backfill omitted by design — fresh DB has no NULL rows) | 00000:906–996,1084–1088 |

## V9 — TS ↔ SQL Parity (verified by simulation)

| Input (cat, prod, size, color, ordinal) | TS `generateSku` | SQL `gen_variant_sku` | Match |
|---|---|---|---|
| mujer, camisa-oversize, M, Blanco, 1 | `…M-BLA-001` | `…M-BLA-001` | ✅ |
| mujer, cinto-cuero, Único, null, 1 | `…UNI-001` | `…UNI-001` | ✅ |
| mujer, cinto-cuero, Única, '', 1 | `…UNI-001` | `…UNI-001` | ✅ |
| hombre, pantalon, S, Índigo, 1 | `…S-ÍND-001` | `…S-ÍND-001` | ✅ |
| hombre, jean-recto, s, Índigo, 5 | `…S-ÍND-005` | `…S-ÍND-005` | ✅ |
| mujer, vestido, S, Marfil, 1 | `…S-MAR-001` | `…S-MAR-001` | ✅ |

Parity holds because DB slugs are pre-sanitized (ASCII-clean) at creation, so `lower(c.slug)` (SQL) ≡ `generateSlug()` (TS) on stored values. **Caveat:** if a raw diacritic slug were ever inserted directly into the DB, SQL `lower()` would preserve the diacritic while TS `generateSlug` (ASCII `\w`) would strip it — a latent divergence outside the current data flow (see SUGGESTION #3).

## Issues

### CRITICAL
_(none)_

### WARNING
- **W1 — `skuStringSchema` is ASCII-only and rejects the spec's own diacritic acceptance examples.** The regex uses `[a-z0-9]`, `[A-Z0-9]`, `[A-Z]{3}`, `\d` (ASCII ranges, no `u` flag). Verified at runtime: `hombre-pantalon-S-ÍND-001` (a test-expected value) → regex returns `false`. Since both TS `generateSku` and the SQL trigger produce diacritic color tokens (e.g. `ÍND` from `Índigo`) and the unit tests assert them, the validation schema is **inconsistent with the spec's own acceptance criteria**. This is exactly the diacritic caveat the V3 task anticipated ("the regex may not handle diacritics — flag as WARNING"). 
  - `skuStringSchema` is currently **not applied** to generated SKUs at any call site (grep: only defined + exported), so it is latent — but it is a real spec-internal contradiction.
  - File: `packages/shared/src/validators/product.ts:57–59`.
- **W2 — Spec scenario example drift (documented user override).** Spec scenario 2's example string `mujer-cinto-cuero-negro-UNICO-001` (SIZE=`UNICO`, 5 chars) is superseded by the user-approved decision `Único/Única → UNI` (3 chars) recorded in tasks #287 and reflected in the tests (`mujer-cinto-cuero-UNI-001`). Spec scenario 1's example (`…-blanca-S-…`) is also informal vs the design format (`…-M-BLA-…`). Implementation follows the **design + user override**, not the literal spec example strings. Non-blocking but a deviation from the written spec examples.

### SUGGESTION
- **S1 — SQL trigger-raise message is not byte-identical to the TS throw.** Design #292 states the 100-cap throws "identical exception message" in both. TS: `SKU generation exceeded max retry attempts (100)` (sku.ts:148). SQL: `SKU generation exceeded max retry attempts (100) for product %` (00002:106). Functionally equivalent; cosmetic divergence only. Consider aligning if an upstream logger matches on the exact string.
- **S2 — Trigger WHEN clause omits the `= ''` guard.** Design #285 draft showed `when ((NEW.sku is null) or (NEW.sku = ''))`; implementation uses `when (NEW.sku is null)` (00002:138). The app never emits an empty-string SKU (createProduct always generates non-empty; updateProduct writes `existingSkuMap.get(v.id) ?? null`), so this is safe in practice — but a direct DB insert with `sku = ''` would slip past the trigger. Add `or NEW.sku = ''` for defense-in-depth.
- **S3 — cat/prod parity depends on the "slugs are ASCII-clean" invariant.** TS `generateSku` lowercases cat/prod via `generateSlug` (strips diacritics, ASCII `\w`); SQL uses only `lower(c.slug)` (preserves diacritics). They match for all currently-produced data because slugs are sanitized at creation (form `slugify`) — but the contract is implicit, not enforced. If seed/import ever writes a diacritic slug directly, the SQL trigger and the TS util would diverge on the cat/prod segment. (Seed convention is 3-segment abbreviations per #283, and seed product/category slugs are ASCII, so current risk is low.)

## Final Verdict

**PASS WITH WARNINGS.**

All code tasks (PR #1–#4) are implemented; unit tests pass (32/32 SKU + 159/159 full web suite); type-check is exit 0 across web/shared/mobile; TS↔SQL SKU generation is parity-correct for all test inputs; the critical R1/R2/R3 risks from exploration #283 are mitigated (upsert-by-variant preserves SKUs; per-batch `used` Set + DB unique constraint prevents collisions; single shared util guarantees parity).

The two WARNINGs are spec-internal inconsistencies (not runtime failures) explicitly anticipated by the verify brief; the SQL message and `= ''` guard are minor hardening SUGGESTIONs. The single pending task is PR #5 (openspec delta docs), which carries no code and is explicitly deferred by design.

**skill_resolution:** sdd-verify (executor, fresh-context adversarial review).
