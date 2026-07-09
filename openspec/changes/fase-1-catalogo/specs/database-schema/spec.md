# Delta for database-schema

## ADDED Requirements

### Requirement: Trigram index for product search

The migration MUST add a pg_trgm GIN index on `products.name` for efficient `ILIKE` searches. An additional migration file `00002_catalog_indexes.sql` SHALL be created.

#### Scenario: Name search uses trigram index

- GIVEN the `products_name_trgm` index
- WHEN searching `SELECT * FROM products WHERE name ILIKE '%remera%'`
- THEN `EXPLAIN ANALYZE` shows a Bitmap Index Scan using the trigram index

#### Scenario: Extension enabled

- GIVEN the `pg_trgm` extension
- WHEN `CREATE EXTENSION IF NOT EXISTS pg_trgm` is run
- THEN `SELECT * FROM pg_extension WHERE extname = 'pg_trgm'` returns the extension

### Requirement: Index on category_id and is_active

The migration MUST add a composite index on `products(category_id, is_active)` for efficient category-filtered queries.

#### Scenario: Category filter uses composite index

- GIVEN the `products_category_active_idx` index
- WHEN querying `SELECT * FROM products WHERE category_id = 'uuid' AND is_active = true`
- THEN `EXPLAIN ANALYZE` shows an Index Scan

## MODIFIED Requirements

### Requirement: Performance indexes

The migration MUST create indexes on `products.name` (trigram), `products.slug`, `orders.customer_id`, `products(category_id, is_active)`.
(Previously: indexes on name, slug, orders.customer_id, and category_id alone)

#### Scenario: Slug lookup uses index

- GIVEN the `products.slug` index
- WHEN querying `SELECT * FROM products WHERE slug = 'remera-negra'`
- THEN `EXPLAIN ANALYZE` shows an Index Scan

#### Scenario: Composite index for category+active

- GIVEN the composite index
- WHEN filtering by category and active status
- THEN the query uses the composite index rather than separate indexes
