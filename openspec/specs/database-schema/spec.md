# Database Schema Specification

## Purpose

Define the initial Supabase migration with all 9 business tables, supporting views, indexes, and automatic updated_at triggers.

## Requirements

### Requirement: Complete table schema

The migration MUST create these tables: `categories`, `products`, `product_variants`, `customers`, `orders`, `order_items`, `purchases`, `purchase_items`, `expenses`, `cash_movements`. Each MUST use UUID primary keys and `timestamptz` for timestamps.

#### Scenario: All tables created after migration

- GIVEN a fresh Supabase project
- WHEN the initial migration runs
- THEN `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` returns exactly 10 tables

#### Scenario: Foreign key constraints prevent orphan rows

- GIVEN an order referencing a non-existent customer
- WHEN `INSERT INTO orders (customer_id) VALUES ('00000000-0000-0000-0000-000000000000')`
- THEN the database MUST reject with foreign key violation

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

### Requirement: Pending-order WhatsApp notification state

The schema MUST track idempotent WhatsApp notification state on `orders` and keep an audit trail in `notification_logs`.

#### Scenario: Order notification state prevents duplicate sends

- GIVEN an order with `status = pending`
- WHEN `notify-sale-whatsapp` claims the notification
- THEN `orders.whatsapp_pending_notification_status` changes from `not_sent` or `failed` to `sending`
- AND concurrent invocations for the same order are skipped

#### Scenario: Successful notification is auditable

- GIVEN Meta WhatsApp Cloud API accepts the template message
- WHEN the notification completes
- THEN `orders.whatsapp_pending_notification_status` becomes `sent`
- AND `orders.whatsapp_pending_notified_at` is set
- AND `notification_logs` records the recipient and provider response

#### Scenario: Failed notification is retryable

- GIVEN Meta WhatsApp Cloud API rejects the notification
- WHEN `notify-sale-whatsapp` catches the failure
- THEN `orders.whatsapp_pending_notification_status` becomes `failed`
- AND `orders.whatsapp_pending_notification_error` stores the error message
- AND a later invocation may retry the notification

## Acceptance Criteria

- [ ] Migration executes without errors on fresh Supabase project
- [ ] All 10 tables, 2 views, and indexes exist
- [ ] Foreign keys enforce referential integrity
- [ ] `updated_at` trigger works on products and orders
- [ ] Pending-order WhatsApp notification state and logs are present

## Dependencies

- `supabase-auth` — required for `customers.user_id` referencing `auth.users`
