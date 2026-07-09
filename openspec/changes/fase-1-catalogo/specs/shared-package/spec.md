# Delta for shared-package

## ADDED Requirements

### Requirement: Filter and sort types

The package MUST export `CatalogFilters` and `CatalogSort` types. `CatalogFilters` SHALL include `category`, `search`, `page`, `pageSize`. `CatalogSort` SHALL include `field` and `direction`.

#### Scenario: CatalogFilters type compiles

- GIVEN the `CatalogFilters` type
- WHEN used as `{ category: 'mujer', search: 'remera', page: 1, pageSize: 12 }`
- THEN TypeScript compiles without error

#### Scenario: Page defaults to 1

- GIVEN a `CatalogFilters` with partial fields
- WHEN used with `{ category: 'hombre' }`
- THEN the type permits missing fields (partial) for defaults

### Requirement: Pagination helper

The package MUST export a `buildPagination` utility that computes `from` and `to` range for offset-based pagination given `page` and `pageSize`.

#### Scenario: buildPagination computes correct range

- GIVEN `page = 2` and `pageSize = 12`
- WHEN `buildPagination(2, 12)` is called
- THEN it returns `{ from: 12, to: 23 }`

## MODIFIED Requirements

### Requirement: Constants catalog

The package MUST export `CATEGORIES`, `COLORS`, `SIZES`, `ORDER_STATUS`, `PAYMENT_METHODS`, `SORT_OPTIONS` as typed constant arrays.
(Previously: exported CATEGORIES, COLORS, SIZES, ORDER_STATUS, PAYMENT_METHODS)

#### Scenario: SORT_OPTIONS is typed

- GIVEN the `SORT_OPTIONS` array
- WHEN accessed
- THEN it contains `{ label: string, value: string }` entries like `{ label: 'Precio: menor a mayor', value: 'price_asc' }`

### Requirement: TypeScript interfaces for all entities

The package MUST export TypeScript interfaces for: `Product`, `ProductVariant`, `Category`, `CatalogFilters`, `CatalogSort`, `Order`, `OrderItem`, `Customer`, `Purchase`, `Expense`, `CashMovement`. Each interface MUST match the corresponding Supabase table schema.
(Previously: 9 entity interfaces without CatalogFilters/CatalogSort)

#### Scenario: CatalogFilters and CatalogSort are exported

- GIVEN the package entry point
- WHEN importing `@mbt/shared`
- THEN `CatalogFilters` and `CatalogSort` are available alongside entity types
