# API Catalog Layer Specification

## Purpose

Shared layer providing typed TanStack Query hooks, Supabase client configuration, and data-access functions for catalog features consumed by both web and mobile.

## Requirements

### Requirement: Typed Supabase client

The layer MUST export a pre-configured Supabase client instance with typed schema from `@mbt/shared`. Both web and mobile SHALL use the same client factory.

#### Scenario: Client returns typed query

- GIVEN the catalog API layer
- WHEN `supabase.from('products').select('*')` is called
- THEN the return type matches `Product[]` from `@mbt/shared`

### Requirement: Catalog query hooks

The layer MUST export TanStack Query hooks: `useProducts(filters)`, `useProduct(slug)`, `useCategories()`. Each hook SHALL manage loading, error, and data states.

#### Scenario: useProducts fetches filtered list

- GIVEN a component using `useProducts({ category: 'mujer', search: 'remera', page: 1 })`
- WHEN the hook mounts
- THEN it calls Supabase with the correct filters AND returns `{ data, isLoading, error }`

#### Scenario: useProducts caches and deduplicates

- GIVEN two components mount with identical filters
- WHEN both call `useProducts({ category: 'hombre', page: 1 })`
- THEN only ONE network request is made AND both receive the same cached data

### Requirement: useInfiniteProducts for mobile

The layer MUST export `useInfiniteProducts(filters)` for infinite scroll. It SHALL manage `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage`.

#### Scenario: Infinite query loads next page

- GIVEN `useInfiniteProducts({ category: 'mujer' })` with 12 items per page
- WHEN `fetchNextPage()` is called
- THEN the next 12 items are appended AND `hasNextPage` is false if fewer than 12 returned

### Requirement: Error handling

All hooks MUST surface Supabase errors as structured error objects. Network failures SHALL NOT crash the UI.

#### Scenario: Network error on fetch

- GIVEN a component using `useProducts()`
- WHEN the network is down AND the query fires
- THEN `error` is populated AND `isLoading` is false AND `data` retains previous cache

### Requirement: Query key convention

All catalog hooks MUST use a consistent query-key structure: `['catalog', 'products', filters]` and `['catalog', 'product', slug]` for proper cache invalidation.

#### Scenario: Invalidate products after mutation

- GIVEN a product is updated by admin
- WHEN `queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })` is called
- THEN all product list queries refetch fresh data

## Acceptance Criteria

- [ ] Hooks return typed data matching `@mbt/shared` interfaces
- [ ] `useProducts` deduplicates requests with same filters
- [ ] `useInfiniteProducts` supports offset-based pagination
- [ ] Network errors surface without crashing
- [ ] Query keys enable predictable cache invalidation

## Dependencies

- `shared-package` — Product, Category, filter types
- `database-schema` — products, categories, product_variants tables
