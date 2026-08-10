# In-Person Sale Items Specification

## Purpose

Manage line items within an in-person sale: product/variant selection, quantity, pricing, and line-item discounts.

## Requirements

### Requirement: Add item to sale

Admins MUST add products or variants to a sale with quantity. The system MUST auto-populate `unit_price` from `products.price` minus `product_variants.discount` if a variant is selected.

#### Scenario: Add product without variant

- GIVEN a product with `price = 10000` and no variant selected
- WHEN adding the item with `quantity = 2`
- THEN `unit_price = 10000`, `subtotal = 20000`

#### Scenario: Add variant with discount

- GIVEN a product with `price = 10000` and a variant with `discount = 20`
- WHEN adding the variant with `quantity = 1`
- THEN `unit_price = 8000` (10000 - 20%), `subtotal = 8000`

#### Scenario: Add variant without discount

- GIVEN a product with `price = 15000` and a variant with `discount = 0`
- WHEN adding the variant
- THEN `unit_price = 15000`

### Requirement: Line-item discount

Each item MAY have an additional `discount_percent` (0-100) applied on top of the variant discount. The system MUST calculate `subtotal = unit_price × quantity × (1 - discount_percent/100)`.

#### Scenario: Apply line-item discount

- GIVEN an item with `unit_price = 10000`, `quantity = 2`, `discount_percent = 10`
- WHEN the item is saved
- THEN `subtotal = 18000` (10000 × 2 × 0.90)

#### Scenario: No line-item discount

- GIVEN an item with `discount_percent = 0`
- WHEN calculating subtotal
- THEN `subtotal = unit_price × quantity`

### Requirement: Stock validation

The system MUST validate available stock before allowing item addition. Stock MUST be checked in real-time against `product_variants.stock`.

#### Scenario: Stock available allows addition

- GIVEN a variant with `stock = 10`
- WHEN adding 5 units to the sale
- THEN the item is added successfully

#### Scenario: Insufficient stock blocks addition

- GIVEN a variant with `stock = 3`
- WHEN attempting to add 5 units
- THEN error "Stock insuficiente. Disponible: 3 unidades"

#### Scenario: Product without variant has no stock check

- GIVEN an item with `variant_id = NULL`
- WHEN adding to the sale
- THEN no stock validation occurs (stock tracked at variant level)

### Requirement: Quantity validation

Item quantity MUST be a positive integer (>= 1). The system MUST reject zero or negative quantities.

#### Scenario: Valid quantity accepted

- GIVEN an admin entering quantity
- WHEN quantity = 3
- THEN the item is added with that quantity

#### Scenario: Zero quantity rejected

- GIVEN an admin entering quantity
- WHEN quantity = 0
- THEN validation fails with "La cantidad debe ser al menos 1"

### Requirement: Remove item from sale

Admins MUST be able to remove items from the sale before confirmation. Removal MUST not affect stock (stock is only decremented on sale confirmation).

#### Scenario: Remove item before sale confirmation

- GIVEN a sale with 3 items in the form
- WHEN the admin removes one item
- THEN the item is removed from the list AND stock is unchanged

### Requirement: Update item quantity

Admins MUST be able to modify the quantity of an existing item in the sale. The system MUST re-validate stock if quantity increases.

#### Scenario: Increase quantity with sufficient stock

- GIVEN an item with `quantity = 2` and variant `stock = 10`
- WHEN the admin changes quantity to 5
- THEN the item updates and `subtotal` recalculates

#### Scenario: Increase quantity with insufficient stock

- GIVEN an item with `quantity = 2` and variant `stock = 3`
- WHEN the admin attempts to change quantity to 5
- THEN error "Stock insuficiente. Disponible: 3 unidades" AND quantity remains 2

### Requirement: Item display in sale form

Each item MUST display: product name, variant label (size/color if applicable), quantity, unit price, discount applied (variant + line-item), and subtotal.

#### Scenario: Item shows variant discount

- GIVEN a variant with size "M", color "Negro", and `discount = 20`
- WHEN viewing the item in the sale form
- THEN it displays "Producto X - M / Negro" with "$8,000 (20% dto. variante)"

#### Scenario: Item shows combined discount

- GIVEN a variant with `discount = 10` and line-item `discount_percent = 5`
- WHEN viewing the item
- THEN it shows both discounts applied to the price

## Edge Cases

### Edge case: Product deleted after adding to sale

- GIVEN an item referencing a product that is later soft-deleted (`is_active = false`)
- WHEN the sale is confirmed
- THEN the sale proceeds (historical product data preserved via FK)

### Edge case: Variant stock changes during sale

- GIVEN a variant with `stock = 10` and an item with `quantity = 5` in the form
- WHEN another sale decrements stock to 3 before confirmation
- THEN the sale confirmation fails with "Stock insuficiente para {producto}"

### Edge case: Multiple items same variant

- GIVEN two separate items in the sale referencing the same variant
- WHEN calculating total stock needed
- THEN the system checks combined quantity against available stock

## Acceptance Criteria

- [ ] Items added with correct pricing from products/variants
- [ ] Variant discount applied to unit_price automatically
- [ ] Line-item discount calculates correctly
- [ ] Stock validation prevents overselling
- [ ] Quantity validation enforces minimum 1
- [ ] Items can be removed before sale confirmation
- [ ] Quantity can be updated with stock re-validation
- [ ] Display shows all discount layers clearly

## Dependencies

- `database-schema` — `in_person_sale_items` table with FKs
- `admin-catalog` — product and variant data
- `shared-package` — InPersonSaleItem type and Zod validator
