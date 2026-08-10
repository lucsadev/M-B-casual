# In-Person Sales Specification

## Purpose

Process walk-in sales for customers not registered in the e-commerce platform. Handles product selection, discounts, payment methods, and balance tracking.

## Requirements

### Requirement: Sale creation flow

Admins MUST create sales by selecting products/variants, quantities, optional discounts, payment method, and optionally a customer. The sale MUST calculate subtotal, apply discounts, and track payment status.

#### Scenario: Create sale with full payment

- GIVEN an admin on the in-person sales page with products in the cart
- WHEN they select payment method "cash", enter `amount_paid` equal to total, and confirm
- THEN the sale is created, stock decremented, cash movement recorded, and success toast shown

#### Scenario: Create sale with partial payment

- GIVEN an admin with a sale total of $5000 and customer selected
- WHEN they enter `amount_paid = 3000` and confirm
- THEN the sale is created with `amount_paid = 3000` AND the customer's balance increases by $2000

#### Scenario: Create sale without customer

- GIVEN an admin processing a walk-in sale without customer selection
- WHEN `amount_paid` is less than total
- THEN the system rejects with "Seleccione un cliente para registrar saldo pendiente"

### Requirement: Payment methods

The system MUST support three payment methods: cash (efectivo), card (tarjeta), and transfer (transferencia). Each method MUST create a corresponding `cash_movements` entry for accounting purposes.

#### Scenario: Cash payment records movement

- GIVEN a sale with `payment_method = 'cash'` and `total = 5000`
- WHEN the sale is saved
- THEN `cash_movements` receives a row with `type = 'income'`, `amount = 5000`, `description = 'Venta presencial - Efectivo'`

#### Scenario: Card payment records for accounting

- GIVEN a sale with `payment_method = 'card'`
- WHEN the sale is saved
- THEN `cash_movements` receives a row with `description = 'Venta presencial - Tarjeta'`

### Requirement: Discount application

Sales MUST support three discount types: percentage (0-100%), fixed amount, or none. The discount MUST apply to the sale subtotal and be recorded in `discount_type` and `discount_value` columns.

#### Scenario: Percentage discount reduces total

- GIVEN a sale with `subtotal = 10000` and `discount_type = 'percentage'`, `discount_value = 10`
- WHEN the sale is calculated
- THEN `total = 9000` (10% off subtotal)

#### Scenario: Fixed discount reduces total

- GIVEN a sale with `subtotal = 10000` and `discount_type = 'fixed'`, `discount_value = 500`
- WHEN the sale is calculated
- THEN `total = 9500`

#### Scenario: Discount cannot exceed subtotal

- GIVEN an admin applying a discount that would make total negative
- WHEN the discount is entered
- THEN validation rejects with "El descuento no puede exceder el subtotal"

### Requirement: Balance usage

Admins MUST be able to apply a customer's existing balance toward a sale payment. The `balance_used` amount MUST reduce the customer's balance and reduce the `amount_due` for the current sale.

#### Scenario: Use customer balance for payment

- GIVEN a customer with `balance = 2000` and a sale with `total = 5000`
- WHEN the admin applies full balance
- THEN `balance_used = 2000`, `amount_due = 3000`, and customer balance becomes 0

#### Scenario: Partial balance usage

- GIVEN a customer with `balance = 3000` and a sale with `total = 2000`
- WHEN the admin applies balance
- THEN `balance_used = 2000`, customer balance becomes 1000 (remainder)

#### Scenario: Balance cannot exceed total

- GIVEN a customer with `balance = 5000` and a sale with `total = 2000`
- WHEN the admin attempts to use $5000 balance
- THEN the system caps `balance_used` at $2000 (the sale total)

### Requirement: Sale validation

The system MUST validate: at least one item in the sale, sufficient stock for all items, valid discount values, amount_paid does not exceed total after balance, customer selected if partial payment.

#### Scenario: Empty sale blocked

- GIVEN an admin attempting to confirm a sale with no items
- WHEN they click confirm
- THEN validation rejects with "Agregue al menos un producto a la venta"

#### Scenario: Amount paid exceeds total

- GIVEN a sale with `total = 5000`
- WHEN the admin enters `amount_paid = 6000`
- THEN validation rejects with "El monto pagado no puede exceder el total"

### Requirement: Sale summary display

The sale confirmation MUST display: item list with quantities and prices, subtotal, discount breakdown, balance applied, total, amount paid, and remaining balance (if any).

#### Scenario: Sale summary shows all calculations

- GIVEN a sale with 2 items, subtotal $10000, 10% discount, $2000 balance applied
- WHEN viewing the summary
- THEN it shows: Subtotal $10,000, Descuento -$1,000, Saldo aplicado -$2,000, Total $7,000

### Requirement: Sale cancellation

Admins MUST be able to cancel a sale before confirmation. Canceling MUST clear the form without affecting stock or balance.

#### Scenario: Cancel sale clears form

- GIVEN an admin with items in the sale form
- WHEN they click cancel
- THEN the form is cleared AND no database changes occur

## Error Scenarios

### Error: Insufficient stock

- GIVEN a variant with `stock = 2`
- WHEN attempting to add 5 units to the sale
- THEN error "Stock insuficiente. Disponible: 2 unidades"

### Error: Customer balance insufficient

- GIVEN a customer with `balance = 500`
- WHEN attempting to use `$1000` balance
- THEN error "Saldo insuficiente. Saldo disponible: $500"

### Error: Invalid discount percentage

- GIVEN an admin entering `discount_value = 150` with type "percentage"
- WHEN the discount is applied
- THEN error "El porcentaje de descuento debe estar entre 0 y 100"

## Edge Cases

### Edge case: 100% discount sale

- GIVEN a sale with `discount_type = 'percentage'`, `discount_value = 100`
- WHEN the sale is confirmed
- THEN `total = 0`, `amount_paid = 0`, no balance tracking needed

### Edge case: Zero-balance customer

- GIVEN a customer with `balance = 0`
- WHEN creating a sale with that customer
- THEN the balance option is disabled or shows "Sin saldo disponible"

### Edge case: Sale with mixed variant discounts

- GIVEN item A (price $100, variant discount 20%) and item B (price $200, no variant discount)
- WHEN calculating subtotal
- THEN item A contributes $80, item B contributes $200, subtotal = $280

## Acceptance Criteria

- [ ] Admin creates sale with products, quantities, and payment method
- [ ] Discount application works for percentage and fixed types
- [ ] Balance tracking updates customer balance on partial payments
- [ ] Balance usage reduces customer balance correctly
- [ ] Sale validation prevents invalid states
- [ ] Stock decrements atomically with sale creation
- [ ] Cash movement created for accounting
- [ ] Error messages are clear and actionable

## Dependencies

- `database-schema` — `in_person_sales`, `in_person_sale_items` tables with triggers
- `in-person-customers` — customer selection and balance tracking
- `in-person-sale-items` — line item management
- `admin-catalog` — product/variant data and pricing
- `shared-package` — InPersonSale type and Zod validator
