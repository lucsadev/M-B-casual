# Admin Purchases Specification

## Purpose

Admin panel for registering supplier purchases with line items. On confirmation, stock is automatically added to each variant. Used by Marianela and Belén to track inventory costs.

## Requirements

### Requirement: Purchase creation with line items

Admins MUST create purchases by specifying supplier_name (required) and adding one or more items (product + optional variant + quantity + unit_cost). Total SHALL be auto-calculated as SUM of item subtotals.

#### Scenario: Create purchase with multiple items

- GIVEN an authenticated admin on /admin/compras
- WHEN they create a purchase for "Mayorista SRL" with 2 items: (Product A, variant M, qty 10, cost 5000) and (Product B, variant L, qty 5, cost 8000)
- THEN the purchase row is created with total 90000 AND both items are saved in `purchase_items`

#### Scenario: Create purchase with zero items fails

- GIVEN an authenticated admin on /admin/compras
- WHEN they attempt to save a purchase with no items
- THEN the form SHALL reject with "Debe agregar al menos un producto" AND no purchase is created

### Requirement: Purchase confirmation with stock update

On confirm, each purchase item SHALL atomically increase `product_variants.stock` by the item quantity. The stock update SHALL use `UPDATE stock = stock + quantity` in a transaction to avoid race conditions.

#### Scenario: Confirm purchase updates stock

- GIVEN variant with stock 5
- WHEN a purchase is confirmed with quantity 10 for that variant
- THEN variant stock becomes 15

#### Scenario: Confirm purchase with no variant updates product tally

- GIVEN a purchase item without a variant_id
- WHEN the purchase is confirmed
- THEN no variant stock changes BUT a cash_movement expense is created

### Requirement: Purchase listing with filters

Admins MUST list purchases paginated, filterable by supplier_name and date range. Results SHALL be ordered by purchase_date descending.

#### Scenario: List purchases by date range

- GIVEN purchases on June 1 and July 1
- WHEN the admin filters by July 1–July 31
- THEN only the July purchase appears

#### Scenario: Filter by supplier name

- GIVEN purchases from "Mayor Pro SA" and "Distribuidora ABC"
- WHEN the admin filters by "Mayor"
- THEN only "Mayor Pro SA" purchases appear (partial match)

### Requirement: Edit access

Only admin users SHALL create, read, update, or delete purchases. RLS on `purchases` and `purchase_items` enforces `is_admin()`.