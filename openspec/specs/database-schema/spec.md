# Database Schema Specification

## Purpose

Define the initial Supabase migration with all 9 business tables, supporting views, indexes, and automatic updated_at triggers.

## Requirements

### Requirement: Complete table schema

The migration MUST create these tables: `categories`, `products`, `product_variants`, `customers`, `orders`, `order_items`, `purchases`, `purchase_items`, `expenses`, `cash_movements`. Each MUST use UUID primary keys and `timestamptz` for timestamps.

> *Delta from `auto-sku-generation`: the `product_variants.sku` column schema is UNCHANGED — it remains `text unique` (nullable, no length cap). A `BEFORE INSERT OR UPDATE` trigger is added to backfill NULL SKUs (see "SKU backfill trigger" below). Seed-data SKU rewrite is OUT OF SCOPE.*

#### Scenario: All tables created after migration

- GIVEN a fresh Supabase project
- WHEN the initial migration runs
- THEN `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` returns exactly 10 tables

#### Scenario: Foreign key constraints prevent orphan rows

- GIVEN an order referencing a non-existent customer
- WHEN `INSERT INTO orders (customer_id) VALUES ('00000000-0000-0000-0000-000000000000')`
- THEN the database MUST reject with foreign key violation

### Requirement: SKU backfill trigger

> *Delta from `auto-sku-generation` (ADDED).* A `BEFORE INSERT OR UPDATE` trigger on `product_variants` MUST auto-generate a SKU using the same derivation logic as the shared `generateSku` util (`packages/shared/src/utils/sku.ts`) when `NEW.sku IS NULL`. The trigger MUST resolve `category_slug` and `product_slug` via joins to `categories` and `products`. A one-time backfill `UPDATE` MUST populate existing NULL-SKU rows using `ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY id)` for deterministic ordinals. Seed data rewrite is OUT OF SCOPE.

The trigger is defined in `supabase/migrations/00002_sku_autofill_trigger.sql` and reconciled into `supabase/migrations/00000_full_database.sql` (§5.18–5.20 functions, §6.11 trigger) so fresh and migrated environments converge.

#### Scenario: DB trigger backfills NULL SKU on insert

- GIVEN a row inserted into `product_variants` with `sku = NULL`, where the product's category slug is `mujer` and product slug is `camisa-oversize`, size "M", color "Blanco"
- WHEN the trigger fires
- THEN it sets `sku` to `mujer-camisa-oversize-M-BLA-001` (matching the shared `generateSku` util output for identical inputs)

#### Scenario: Existing SKUs are never overwritten

- GIVEN a variant row with an existing non-NULL SKU
- WHEN the row is updated (e.g. stock changes)
- THEN the trigger MUST NOT modify the existing SKU (the `WHEN (NEW.sku IS NULL)` guard preserves it)

### Requirement: Supporting views

The migration MUST create `monthly_sales` (aggregating delivered orders by month) and `low_stock` (product variants with stock < 5).

#### Scenario: Monthly sales view returns correct aggregation

- GIVEN delivered orders with varying totals
- WHEN querying `monthly_sales`
- THEN it returns monthly revenue, order count, and average ticket

### Requirement: Performance indexes

The migration MUST create indexes on `products.name`, `products.slug`, `orders.customer_id`, and `products.category_id`.

#### Scenario: Slug lookup uses index

- GIVEN the `products.slug` index
- WHEN querying `SELECT * FROM products WHERE slug = 'remera-negra'`
- THEN `EXPLAIN ANALYZE` shows an Index Scan

### Requirement: Automatic updated_at trigger

The migration MUST create a function and trigger on `products` and `orders` to auto-set `updated_at = now()` on row update.

#### Scenario: Updated_at changes on update

- GIVEN an existing product
- WHEN updating its `price`
- THEN `updated_at` automatically changes to the current timestamp

## Acceptance Criteria

- [ ] Migration executes without errors on fresh Supabase project
- [ ] All 10 tables, 2 views, and indexes exist
- [ ] Foreign keys enforce referential integrity
- [ ] `updated_at` trigger works on products and orders
- [ ] SKU backfill trigger (`BEFORE INSERT OR UPDATE … WHEN NEW.sku IS NULL`) fills NULL SKUs on insert
- [ ] One-time backfill UPDATE populates existing NULL-SKU rows with deterministic ordinals

## Dependencies

- `supabase-auth` — required for `customers.user_id` referencing `auth.users`
