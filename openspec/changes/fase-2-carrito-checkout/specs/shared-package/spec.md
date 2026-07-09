# Delta for Shared Package

## ADDED Requirements

### Requirement: CartItem and CartActions types

The package MUST export TypeScript interfaces `CartItem` (matching the `cart_items` table columns: id, user_id, product_id, variant_id, quantity, created_at, updated_at) and `CartActions` (addItem, updateQuantity, removeItem, clearCart).

#### Scenario: CartItem product joined

- GIVEN a `CartItem` with product_id
- WHEN used in the UI
- THEN the product name, price, and image are resolved via a Supabase join query

### Requirement: CheckoutFormData type and schema

The package MUST export a `CheckoutFormData` interface and a `CheckoutFormSchema` Zod schema with fields: `fullName` (required, min 3), `address` (required, min 10), `phone` (required, regex for AR format), `paymentMethod` (enum: transferencia, efectivo, mp).

#### Scenario: Valid checkout form data passes

- GIVEN a complete object with valid name, address, phone, and payment method
- WHEN validated with `CheckoutFormSchema`
- THEN it returns success

### Requirement: SHIPPING_COST constant

The package MUST export `SHIPPING_COST` as a numeric constant (default 0) and `PAYMENT_METHODS` as a typed array: `['transferencia', 'efectivo', 'mp']`.

#### Scenario: Constants are configurable

- GIVEN `SHIPPING_COST`
- WHEN changed in constants
- THEN the checkout total reflects the new value

### Requirement: OrderSummary type

The package MUST export an `OrderSummary` interface: `{ items: OrderItem[], subtotal: number, shipping: number, total: number, paymentMethod: string }`.

#### Scenario: OrderSummary computed correctly

- GIVEN cart items with prices and quantities
- WHEN computing `OrderSummary`
- THEN subtotal = sum of (price * quantity)
- AND total = subtotal + shipping cost

## MODIFIED Requirements

### Requirement: TypeScript interfaces for all entities

Package now exports 12 entity types (previously 9) including `CartItem`, `CheckoutFormData`, and `OrderSummary`.
(Previously: 9 entity types matching Supabase tables)

#### Scenario: CartItem interface matches DB

- GIVEN the `CartItem` interface
- WHEN instantiated with all fields
- THEN TypeScript compilation succeeds

#### Scenario: All 12 entities available from index

- GIVEN the package entry point
- WHEN importing `@mbt/shared`
- THEN `CartItem`, `CheckoutFormData`, and `OrderSummary` are available

### Requirement: Constants catalog

Package now exports `SHIPPING_COST` and updated `PAYMENT_METHODS` in addition to existing constants.
(Previously: CATEGORIES, COLORS, SIZES, ORDER_STATUS, PAYMENT_METHODS)

#### Scenario: PAYMENT_METHODS matches proposal

- GIVEN `PAYMENT_METHODS` array
- WHEN accessed
- THEN it contains `transferencia`, `efectivo`, `mp`

## Acceptance Criteria (Updated)

- [ ] All 12 entity interfaces and Zod schemas defined
- [ ] `import { CartItem, CheckoutFormSchema, SHIPPING_COST } from '@mbt/shared'` works
- [ ] Constants reflect shipping and payment config
