# Delta for Database Schema

## ADDED Requirements

### Requirement: In-person customers table

The system MUST create an `in_person_customers` table to store walk-in customer data separate from authenticated customers. Each record SHALL have: `id` (UUID PK), `name` (required), `phone` (optional), `email` (optional), `address` (optional), `notes` (optional), `balance` (numeric, default 0), `is_active` (boolean, default true), `created_at`, `updated_at`.

#### Scenario: Create in-person customer with minimal data

- GIVEN an admin creates an in-person customer with only a name
- WHEN the record is inserted
- THEN the customer is stored with `balance = 0`, `is_active = true`, and all optional fields are NULL

#### Scenario: Balance tracks unpaid amounts

- GIVEN an in-person customer with `balance = 0`
- WHEN a partial payment sale leaves an unpaid remainder
- THEN the `balance` column reflects the accumulated debt (positive value)

### Requirement: In-person sales table

The system MUST create an `in_person_sales` table to record walk-in transactions. Each sale SHALL have: `id` (UUID PK), `customer_id` (FK to `in_person_customers`, optional), `subtotal` (numeric), `discount_type` (enum: 'percentage', 'fixed', 'none'), `discount_value` (numeric), `total` (numeric), `amount_paid` (numeric), `balance_used` (numeric, default 0), `payment_method` (enum: 'cash', 'card', 'transfer'), `notes` (optional), `created_by` (FK to `auth.users`), `created_at`.

#### Scenario: Sale with full payment

- GIVEN an admin creates a sale with `total = 5000` and `amount_paid = 5000`
- WHEN the sale is inserted
- THEN `balance_used = 0` and the customer balance remains unchanged

#### Scenario: Sale with partial payment adds to customer balance

- GIVEN a customer with `balance = 0`
- WHEN a sale is created with `total = 5000`, `amount_paid = 3000`, and `customer_id` set
- THEN the customer's `balance` increases by 2000

#### Scenario: Sale without customer

- GIVEN an admin creates a sale without selecting a customer
- WHEN `customer_id = NULL`
- THEN the sale is recorded and `amount_paid` MUST equal `total` (no balance tracking possible)

### Requirement: In-person sale items table

The system MUST create an `in_person_sale_items` table linking sales to products/variants. Each item SHALL have: `id` (UUID PK), `sale_id` (FK to `in_person_sales`), `product_id` (FK to `products`), `variant_id` (FK to `product_variants`, optional), `quantity` (integer > 0), `unit_price` (numeric), `discount_percent` (integer 0-100, default 0), `subtotal` (numeric).

#### Scenario: Sale item with variant-specific price

- GIVEN a product with `price = 10000` and a variant with `discount = 20`
- WHEN the item is added with `quantity = 2`
- THEN `unit_price = 8000` (price - 20% variant discount), `subtotal = 16000`

#### Scenario: Additional line-item discount applied

- GIVEN an item with `unit_price = 8000`, `quantity = 1`, and `discount_percent = 10`
- WHEN the item is saved
- THEN `subtotal = 7200` (10% off the unit_price × quantity)

### Requirement: Stock decrement trigger

A `BEFORE INSERT` trigger on `in_person_sale_items` MUST decrement `product_variants.stock` for each item in the same transaction. The trigger MUST raise an exception if stock would go negative.

#### Scenario: Stock decrements on sale

- GIVEN a variant with `stock = 10`
- WHEN a sale item is inserted with `quantity = 3` for that variant
- THEN the variant's `stock` becomes 7

#### Scenario: Insufficient stock blocks sale

- GIVEN a variant with `stock = 2`
- WHEN a sale item is inserted with `quantity = 5` for that variant
- THEN the transaction is aborted with error "Stock insuficiente para el variant {sku}"

#### Scenario: Stock decrement for product without variant

- GIVEN a sale item with `variant_id = NULL` and `product_id` set
- WHEN the trigger fires
- THEN no stock change occurs (stock is tracked at variant level only)

### Requirement: Cash movement trigger

An `AFTER INSERT` trigger on `in_person_sales` MUST create a `cash_movements` income entry with `reference_type = 'in_person_sale'` and `reference_id` matching the sale ID.

#### Scenario: Cash movement created on sale

- GIVEN a completed sale with `total = 5000` and `payment_method = 'cash'`
- WHEN the sale is inserted
- THEN a `cash_movements` row is created with `type = 'income'`, `amount = 5000`, `description = 'Venta presencial'`

#### Scenario: Non-cash payment still creates cash movement

- GIVEN a sale with `payment_method = 'card'`
- WHEN the sale is inserted
- THEN a `cash_movements` row is created (for accounting purposes, not physical cash)

### Requirement: Performance indexes

Indexes MUST be created on: `in_person_customers(name)`, `in_person_customers(phone)`, `in_person_sales(customer_id)`, `in_person_sales(created_at)`, `in_person_sale_items(sale_id)`, `in_person_sale_items(product_id)`, `in_person_sale_items(variant_id)`.

#### Scenario: Customer search by name uses index

- GIVEN the `in_person_customers(name)` index
- WHEN querying `SELECT * FROM in_person_customers WHERE name ILIKE '%María%'`
- THEN `EXPLAIN ANALYZE` shows an Index Scan

### Requirement: Row-level security policies

RLS policies MUST restrict all `in_person_*` tables to users with `auth.jwt() ->> 'role' = 'admin'`. All tables MUST have SELECT, INSERT, UPDATE policies. DELETE SHALL be blocked (soft delete via `is_active` for customers).

#### Scenario: Admin can query in-person customers

- GIVEN a user with JWT role `admin`
- WHEN executing `SELECT * FROM in_person_customers`
- THEN all records are returned

#### Scenario: Non-admin cannot access in-person tables

- GIVEN a user without admin role or unauthenticated
- WHEN executing `SELECT * FROM in_person_sales`
- THEN zero rows are returned

## Acceptance Criteria

- [ ] Three new tables created with correct columns and constraints
- [ ] Stock trigger decrements `product_variants.stock` atomically
- [ ] Stock trigger raises exception on insufficient stock
- [ ] Cash movement trigger creates income entry on sale insert
- [ ] All seven indexes created
- [ ] RLS policies restrict to admin role only
- [ ] Migration runs clean on fresh project
