# Mobile Catalog Specification

## Purpose

Native mobile catalog using Expo Router, FlatList with infinite scroll, product detail with size/color selector, and offline caching via MMKV.

## Requirements

### Requirement: Infinite scroll catalog

The mobile catalog MUST use `useInfiniteQuery` with FlatList to paginate products. New pages SHALL load automatically when the user scrolls near the bottom.

#### Scenario: Load more products on scroll

- GIVEN a user on the mobile catalog
- WHEN they scroll to 80% of the visible list
- THEN the next page of products is fetched AND appended to the list

#### Scenario: All products loaded

- GIVEN the user has scrolled through all available products
- WHEN reaching the end
- THEN the list shows "You've reached the end" AND no further fetch is attempted

### Requirement: Category filter navigation

Products MUST be filterable by category via Expo Router params: `/catalog?category=mujer`. Category tabs SHALL be horizontally scrollable at the top.

#### Scenario: Switch category

- GIVEN a user on the catalog screen
- WHEN tapping the "Accesorios" tab
- THEN the list resets AND shows only accesorios products

### Requirement: Product detail with variant selector

Product detail screen MUST show: image carousel, name, price, size picker, color picker, and stock indicator. Selection MUST be smooth and native.

#### Scenario: Select variant with stock

- GIVEN a user on product detail
- WHEN they pick size "L" and color "Beige"
- THEN the UI displays the stock count for that variant AND updates the price if different

#### Scenario: Variant goes out of stock after selection

- GIVEN a user selected a variant with stock > 0
- WHEN stock reaches 0 (concurrent purchase)
- THEN the UI shows "Agotado" AND disables the add-to-cart button

### Requirement: Offline cache

The catalog MUST cache product data locally via TanStack Query persistence to MMKV. Cached data SHALL be shown immediately while fresh data loads in the background (stale-while-revalidate).

#### Scenario: View catalog offline

- GIVEN a user who previously visited the catalog with connectivity
- WHEN they open the catalog without internet
- THEN previously loaded products are displayed from MMKV cache

#### Scenario: Pull-to-refresh when offline

- GIVEN an offline user on the catalog
- WHEN they pull to refresh
- THEN the UI shows "No internet connection" toast AND does NOT clear the cache

### Requirement: Expo Router navigation

All catalog screens MUST use Expo Router file-based routing. Routes: `/catalog`, `/catalog/[category]`, `/product/[slug]`.

#### Scenario: Navigate to product detail

- GIVEN a user on the catalog list
- WHEN they tap a product card
- THEN the app navigates to `/product/{slug}` AND the detail screen renders

## Acceptance Criteria

- [ ] FlatList loads more products on scroll (infinite scroll)
- [ ] Category filter resets and queries correctly
- [ ] Variant selector shows stock and updates on selection
- [ ] Offline cache serves stale data without crash
- [ ] Expo Router routes resolve correctly

## Dependencies

- `api-catalog-layer` — shared hooks and typed client
- `admin-catalog` — products in DB via admin
- `shared-package` — Product, ProductVariant types
