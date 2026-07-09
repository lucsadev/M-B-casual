# Tasks: Fase 1 — Catálogo de Productos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,200+ |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + shared types | PR 1 | Base = `feat/fase-1-catalogo`. DB mig, shared types, lib clients |
| 2 | API layer + Admin CRUD | PR 2 | Base = PR 1 branch. Hooks + admin product pages |
| 3 | Web + Mobile catalog UI | PR 3 | Base = PR 2 branch. Public catalog both platforms |
| 4 | Tests + polish | PR 4 | Base = PR 3 branch. Coverage, edge cases, E2E |

## Phase 1: Foundation — Shared + DB + Libs

- [x] 1.1 Create `packages/shared/src/types/catalog.ts` — CatalogFilters, CatalogSort interfaces
- [x] 1.2 Create `packages/shared/src/utils/pagination.ts` — buildPagination(page, pageSize) helper
- [x] 1.3 Create `packages/shared/src/constants/sort-options.ts` — SORT_OPTIONS array
- [x] 1.4 Wire exports in shared `types/index.ts`, `utils/index.ts`, `constants/index.ts`
- [x] 1.5 Create `supabase/migrations/00002_catalog_indexes.sql` — pg_trgm, trigram index, composite index
- [x] 1.6 Create `packages/web/src/lib/supabase.ts` — typed client factory
- [x] 1.7 Create `packages/web/src/lib/query-client.ts` — TanStack Query client config
- [x] 1.8 Create `packages/mobile/src/lib/supabase.ts` — typed client factory (PR 5 — mobile)
- [x] 1.9 Create `packages/mobile/src/lib/query-client.ts` — TQ client with AsyncStorage persist (PR 5 — mobile)
- [x] 1.10 Create `packages/mobile/src/lib/storage.ts` — AsyncStorage instance + TQ persister (PR 5 — mobile)

## Phase 2: API Layer — Shared Hooks

- [x] 2.1 Create `packages/web/src/features/catalog/hooks/use-products.ts` — useProducts(filters)
- [x] 2.2 Create `packages/web/src/features/catalog/hooks/use-product.ts` — useProduct(slug)
- [x] 2.3 Create `packages/web/src/features/catalog/hooks/use-categories.ts` — useCategories()
- [x] 2.4 Create `packages/web/src/hooks/use-debounce.ts` — debounce hook for search
- [x] 2.5 Create `packages/web/src/hooks/use-url-filters.ts` — read/write filters in URL params
- [x] 2.6 Create `packages/mobile/src/features/catalog/hooks/use-products.ts` — useProducts + useInfiniteProducts
- [x] 2.7 Create `packages/mobile/src/features/catalog/hooks/use-product.ts` — useProduct(slug)
- [x] 2.8 Create `packages/mobile/src/hooks/use-debounce.ts` — debounce hook

## Phase 3: Admin CRUD

- [x] 3.1 Create `packages/web/src/features/admin/guards/AdminGuard.tsx` — role-based route guard
- [x] 3.2 Create `packages/web/src/features/admin/products/api/use-product-mutations.ts` — useCreateProduct, useUpdateProduct, useDeleteProduct
- [x] 3.3 Create `packages/web/src/features/admin/products/components/ProductForm.tsx` — RHF + Zod form
- [x] 3.4 Create `packages/web/src/features/admin/products/components/VariantManager.tsx` — inline variant CRUD
- [x] 3.5 Create `packages/web/src/features/admin/products/components/ImageUploader.tsx` — drag-drop upload to Storage
- [x] 3.6 Create `packages/web/src/features/admin/products/pages/ProductListPage.tsx` — table with actions
- [x] 3.7 Create `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` — create/edit form page
- [x] 3.8 Wire admin routes in web app router under `/admin/*` with AdminGuard

## Phase 4: Web Catalog UI

- [x] 4.1 Create `ProductGrid.tsx` — responsive grid with shadcn/ui Card
- [x] 4.2 Create `ProductCard.tsx` — card with image, name, price, category badge
- [x] 4.3 Create `CategoryFilter.tsx` — horizontal category tabs/chips
- [x] 4.4 Create `SearchBar.tsx` — debounced search with useDebounce
- [x] 4.5 Create `CatalogPage.tsx` — `/catalogo` with filters + grid + pagination
- [x] 4.6 Create `ProductDetailPage.tsx` — `/producto/:slug` with variant selector
- [x] 4.7 Wire catalog routes in web app router, add SEO meta tags

## Phase 5: Mobile Catalog UI

- [x] 5.1 Create `ProductListItem.tsx` — FlatList item with image + price + badge
- [x] 5.2 Create `VariantSelector.tsx` — native picker for size + color swatches
- [x] 5.3 Create `CatalogScreen.tsx` — category tabs + search + FlatList infinite scroll
- [x] 5.4 Create `ProductDetailScreen.tsx` — detail with VariantSelector + add-to-cart placeholder
- [x] 5.5 Wire catalog screens in Expo Router navigation

## Phase 6: Testing

- [ ] 6.1 Unit tests: buildPagination() edge cases (page=0, negative, decimals)
- [ ] 6.2 Hook tests: useProducts renders + dedup with identical filters
- [ ] 6.3 Integration: admin create → list → update product flow
- [ ] 6.4 E2E: web catalog filter + search + paginate flow
- [ ] 6.5 E2E: mobile catalog scroll + pull-to-refresh + offline cache
