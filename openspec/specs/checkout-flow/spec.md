# Checkout Flow Specification

## Purpose

Handle the order placement flow: collect shipping info, select payment method, review order summary, and create the order atomically.

## Requirements

### Requirement: Shipping form

The checkout MUST present a validated form with name, address, and phone fields using react-hook-form + Zod.

#### Scenario: Valid shipping form

- GIVEN the checkout page
- WHEN the user fills all required fields validly
- THEN no validation errors appear

#### Scenario: Missing required field

- GIVEN the checkout page
- WHEN the user submits without a required field
- THEN inline validation error shows for that field
- AND the order is NOT submitted

### Requirement: Payment method selection

The user MUST select one of: transferencia bancaria, efectivo, or Mercado Pago. The selected method SHALL be stored in `orders.payment_method`.

#### Scenario: User selects payment method

- GIVEN the checkout page
- WHEN the user picks "Mercado Pago"
- THEN the selection is reflected in the form state
- AND it is saved to the order on submission

### Requirement: Order summary

A read-only summary SHALL display all cart items, quantities, unit prices, subtotals, shipping cost, and total.

#### Scenario: Summary matches cart

- GIVEN items in the cart
- WHEN viewing checkout
- THEN each item, its quantity, unit price, and subtotal are listed
- AND the total = sum of subtotals + shipping cost

### Requirement: Atomic order creation

On "Confirmar orden" the system MUST perform a transactional insert: INSERT into `orders`, INSERT into `order_items`, DELETE all `cart_items` for the user.

#### Scenario: Order created successfully

- GIVEN valid shipping info and selected payment
- WHEN the user confirms the order
- THEN a new `orders` row is created with status `pending`
- AND `order_items` rows are created matching cart contents
- AND all `cart_items` for the user are deleted
- AND the app navigates to `/gracias/{orderId}`

#### Scenario: Duplicate submission prevented

- GIVEN a submitted order
- WHEN the user clicks "Confirmar orden" again
- THEN the button is disabled while the mutation is pending
- AND no duplicate order is created

#### Scenario: Server error during creation

- GIVEN a network or DB error
- WHEN the order creation fails
- THEN the cart items are NOT deleted
- AND an error message is displayed
- AND the user can retry
