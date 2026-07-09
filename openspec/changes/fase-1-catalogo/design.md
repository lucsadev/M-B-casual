# Design: Fase 1 — Catálogo de Productos

## Technical Approach

Four capabilities delivered in parallelizable work units sharing a common data layer. Supabase RLS enforces access (admin writes, public reads). TanStack Query provides shared caching across web and mobile. Admin panel uses React Router `/admin/*` with role guard. Web catalog uses query-param-based filtering. Mobile catalog uses `useInfiniteQuery` + FlatList + MMKV persistence.

Specs: admin-catalog, catalog-display-web, mobile-catalog, api-catalog-layer, database-schema (delta), shared-package (delta).

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| **Admin forms**: react-hook-form vs raw state | RHF reduces boilerplate for complex nested variants; couples to Zod via `@hookform/resolvers` | **react-hook-form + zodResolver** — variant CRUD is deeply nested |
| **Image serving**: transformation URL vs client resize | Supabase Image Transform costs bandwidth but zero client work; need `?width=` param convention | **Supabase Image Transform API** — thumbnails via `&width=200&format=webp` |
| **Admin guard**: middleware vs layout HOC | Middleware cannot read JWT claims in Vite SPA; layout guard reads `auth.jwt() -> 'role'` client-side | **`<AdminGuard>`** component wrapping admin routes |
| **Search**: pg_trgm ILIKE vs Full-Text Search | FTS needs `to_tsvector` update on write; trigram ILIKE works with minimal infra | **pg_trgm GIN index** on `products.name` — MVP simplicity |
| **Offline mobile**: AsyncStorage vs MMKV | MMKV is 30x faster; AsyncStorage is async and blocking on RN | **MMKV** via `react-native-mmkv` + TanStack Query persist |
| **Pagination**: cursor vs offset | Cursor is robust but requires `cursor` column; offset is simpler for MVP | **Offset-based** — `page` + `pageSize`, `buildPagination()` helper |

## Data Flow

```
[Admin Web Form] ──→ react-hook-form ──→ Zod validate ──→ Supabase mutate
                        │                                        │
                        └── image upload ─────────────────→ Storage (product-images/)

[Web Catalog] ──→ useProducts(filters) ──→ supabase.from('products').select()
     │                                          │
     └── query params (category, search) ───────┘

[Mobile Catalog] ──→ useInfiniteProducts() ──→ supabase.range(from, to)
     │                                                  │
     └── FlatList onEndReached ──→ fetchNextPage ───────┘
     └── MMKV cache ← TanStack Query persist
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/types/catalog.ts` | Create | `CatalogFilters`, `CatalogSort` interfaces |
| `packages/shared/src/utils/pagination.ts` | Create | `buildPagination(page, pageSize)` helper |
| `packages/shared/src/constants/sort-options.ts` | Create | `SORT_OPTIONS` constant array |
| `packages/shared/src/types/index.ts` | Modify | Export `CatalogFilters`, `CatalogSort` |
| `packages/shared/src/utils/index.ts` | Modify | Export `buildPagination` |
| `packages/shared/src/constants/index.ts` | Modify | Export `SORT_OPTIONS` |
| `supabase/migrations/00002_catalog_indexes.sql` | Create | pg_trgm extension, trigram index, composite index |
| `packages/web/src/lib/supabase.ts` | Create | Typed Supabase client factory |
| `packages/web/src/lib/query-client.ts` | Create | TanStack Query client configuration |
| `packages/web/src/features/catalog/api/use-products.ts` | Create | `useProducts(filters)` hook |
| `packages/web/src/features/catalog/api/use-product.ts` | Create | `useProduct(slug)` hook |
| `packages/web/src/features/catalog/api/use-categories.ts` | Create | `useCategories()` hook |
| `packages/web/src/features/catalog/components/ProductGrid.tsx` | Create | Responsive grid with shadcn/ui |
| `packages/web/src/features/catalog/components/ProductCard.tsx` | Create | Card component for grid items |
| `packages/web/src/features/catalog/components/CategoryFilter.tsx` | Create | Category tabs/chips filter |
| `packages/web/src/features/catalog/components/SearchBar.tsx` | Create | Debounced search input |
| `packages/web/src/features/catalog/pages/CatalogPage.tsx` | Create | `/catalogo` page with grid + filters |
| `packages/web/src/features/catalog/pages/ProductDetailPage.tsx` | Create | `/producto/:slug` detail page |
| `packages/web/src/features/admin/guards/AdminGuard.tsx` | Create | Role-based route guard |
| `packages/web/src/features/admin/products/api/use-product-mutations.ts` | Create | `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct` |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` | Create | RHF + Zod form for product CRUD |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | Create | Inline variant CRUD (size/color/stock/SKU) |
| `packages/web/src/features/admin/products/components/ImageUploader.tsx` | Create | Drag-and-drop upload to Supabase Storage |
| `packages/web/src/features/admin/products/pages/ProductListPage.tsx` | Create | `/admin/productos` table list |
| `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | Create | `/admin/productos/nuevo` and `/admin/productos/:id` |
| `packages/web/src/hooks/use-debounce.ts` | Create | Debounce hook for search |
| `packages/web/src/hooks/use-url-filters.ts` | Create | Read/write filters in URL query params |
| `packages/mobile/src/lib/supabase.ts` | Create | Typed Supabase client for mobile |
| `packages/mobile/src/lib/query-client.ts` | Create | TQ client with MMKV persist |
| `packages/mobile/src/lib/storage.ts` | Create | MMKV instance and TQ persister |
| `packages/mobile/src/features/catalog/api/use-products.ts` | Create | `useProducts(filters)`, `useInfiniteProducts()` |
| `packages/mobile/src/features/catalog/api/use-product.ts` | Create | `useProduct(slug)` |
| `packages/mobile/src/features/catalog/components/ProductListItem.tsx` | Create | FlatList item component |
| `packages/mobile/src/features/catalog/components/VariantSelector.tsx` | Create | Native size/color picker |
| `packages/mobile/src/features/catalog/screens/CatalogScreen.tsx` | Create | `/catalog` with category tabs + FlatList |
| `packages/mobile/src/features/catalog/screens/ProductDetailScreen.tsx` | Create | `/product/[slug]` detail screen |
| `packages/mobile/src/hooks/use-debounce.ts` | Create | Debounce hook for mobile search |

## Interfaces / Contracts

```typescript
// packages/shared/src/types/catalog.ts
export interface CatalogFilters {
  category?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface CatalogSort {
  field: 'price' | 'name' | 'created_at';
  direction: 'asc' | 'desc';
}

// Query key convention (api-catalog-layer spec)
// ['catalog', 'products', filters]   → list queries
// ['catalog', 'product', slug]       → single product
// ['catalog', 'categories']          → categories

// Admin mutation keys
// ['admin', 'products']              → invalidate after create/update/delete
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `buildPagination()`, validators | Pure function tests |
| Unit | `useProducts` hook render | Vitest + renderHook |
| Integration | Admin CRUD flow (create → list → update) | Cypress component or Vitest + MSW |
| E2E | Web catalog: filter, search, paginate | Cypress E2E |
| E2E | Mobile catalog: scroll, navigate detail | Detox or manual QA |

## Migration / Rollout

Apply `00002_catalog_indexes.sql` migration first (zero-downtime). Admin CRUD can be deployed independently — it reads/writes the same schema. Web and mobile catalog depend on data existing in the DB, so admin CRUD is a prerequisite for acceptance testing.

## Open Questions

- [ ] Exact Supabase Storage transform URL format for thumbnails (confirm `?width=200&format=webp` works on free tier)
- [ ] react-hook-form nested field array typing for variants implementation pattern
