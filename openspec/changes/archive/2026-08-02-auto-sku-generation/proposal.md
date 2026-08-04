# Proposal: Auto SKU Generation

## Intent

SKUs are 100% manually entered by admins (web + mobile), and both `updateProduct` implementations use delete-all + re-insert, silently wiping every variant SKU on each product edit. Goal: SKUs become 100% auto-generated on variant creation with no manual input, and updates preserve existing SKUs.

## Scope

### In Scope
- Shared `generateSku` util in `@mbt/shared` — format `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`
- Web + mobile mutation integration: generate SKU on variant create
- `updateProduct` reform: delete+reinsert → upsert-by-variant preserving existing SKUs (web + mobile)
- Hide SKU input: VariantManager.tsx + mobile `[id].tsx`; drop sku pass-through in ProductFormPage + mobile create
- DB trigger fallback: auto-fill NULL sku at DB level
- Unit tests for the generator util (web vitest — `pnpm --filter web test`)

### Out of Scope
- Seed data SKU rewrite (deferred — R4 in exploration)
- Mobile/shared test runner setup (no vitest there yet)

## Capabilities

### New Capabilities
- `sku-generation`: auto SKU format, token derivation, per-product collision ordinal, generation trigger

### Modified Capabilities
- `admin-catalog`: variant CRUD — SKU auto-generated (no manual input), updateProduct preserves SKUs
- `database-schema`: `product_variants.sku` insert trigger fallback (backfill NULL)
- `shared-package`: exports `generateSku` for web + mobile

## Approach

Option B (exploration): pure TS `generateSku({categorySlug, productSlug, size, color})` in `packages/shared/src/utils/sku.ts`, exported via `utils/index.ts`. Called by the web and mobile create paths when the variant has no SKU; per-product ordinal `-NNN` for collision safety (R2). Reform both `updateProduct` implementations to upsert-by-variant (match on variant id) so existing SKUs survive edits (R1). Hide SKU inputs in admin forms. Add a Postgres insert trigger to backfill NULL SKUs as a last-resort fallback. Unit tests live in web's vitest importing from `@mbt/shared` (shared has no test runner).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/shared/src/utils/sku.ts` | New | `generateSku` util + token derivation |
| `packages/shared/src/utils/index.ts` | Modified | export `generateSku` |
| `packages/web/src/features/admin/products/api/use-product-mutations.ts` | Modified | upsert-by-variant, preserve sku |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | Modified | hide SKU input |
| `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | Modified | drop sku pass-through |
| `packages/mobile/src/features/admin/api/use-admin-products.ts` | Modified | upsert-by-variant, preserve sku |
| `packages/mobile/src/app/(admin)/productos/[id].tsx` | Modified | hide SKU input, drop local slugify |
| `supabase/migrations/00000_full_database.sql` | Modified | sku backfill trigger |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| R1 updateProduct wipes SKUs | High | upsert-by-variant reform in tandem |
| R2 SKU collisions | Med | per-product ordinal `-NNN` |
| R3 web/mobile divergence | Med | single shared util in `@mbt/shared` |
| R4 seed format mismatch | Low | deferred; no read path depends on format |
| R5 free-text color noise | Med | slugify + truncate to 3 chars in util |

## Rollback Plan

Revert migration (drop trigger). Restore SKU inputs and delete+reinsert logic from git history. New SKUs are additive — no data migration; existing SKUs preserved, `sku text unique` stays as guard.

## Dependencies

- Existing fields: `categories.slug`, `products.slug`, `product_variants.size/color` (all present)
- Test runner: web vitest only (`pnpm --filter web test`)

## Success Criteria

- [ ] `generateSku` unit tests pass (`pnpm --filter web test`)
- [ ] New variant gets `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`; no manual SKU input visible
- [ ] Editing a product preserves all existing variant SKUs
- [ ] Duplicate size×color under one product gets distinct `-NNN` ordinals
- [ ] DB trigger backfills NULL SKU on insert
