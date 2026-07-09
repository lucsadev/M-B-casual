# Shared Package Specification

## Purpose

Define `@mbt/shared` — the single source of truth for types, validation schemas, constants, and utilities consumed by both web and mobile apps.

## Requirements

### Requirement: TypeScript interfaces for all entities

The package MUST export TypeScript interfaces for: `Product`, `ProductVariant`, `Category`, `Order`, `OrderItem`, `Customer`, `Purchase`, `Expense`, `CashMovement`. Each interface MUST match the corresponding Supabase table schema.

#### Scenario: Product interface has required fields

- GIVEN the `Product` interface
- WHEN instantiated without `name` or `price`
- THEN TypeScript compilation MUST fail

#### Scenario: All entities are exported from index

- GIVEN the package entry point
- WHEN importing `@mbt/shared`
- THEN all 9 entity types are available

### Requirement: Zod validation schemas

Each entity MUST have a corresponding Zod schema with field validation: required strings, positive numbers for monetary fields, UUID format for IDs, and enums for constrained values.

#### Scenario: Valid product passes schema

- GIVEN a valid product object with name, price, category_id
- WHEN validated with `ProductSchema`
- THEN it returns success with parsed data

#### Scenario: Invalid price fails validation

- GIVEN a product with negative price
- WHEN validated with `ProductSchema`
- THEN it returns failure with field-level error message

### Requirement: Constants catalog

The package MUST export `CATEGORIES`, `COLORS`, `SIZES`, `ORDER_STATUS`, and `PAYMENT_METHODS` as typed constant arrays.

#### Scenario: Constants are typed

- GIVEN `ORDER_STATUS` array
- WHEN accessed
- THEN each value matches the database enum (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`)

### Requirement: Format utilities

The package MUST export `formatPrice` (ARS currency), `formatDate` (locale-aware), and `generateSlug` (lowercase, hyphenated).

#### Scenario: formatPrice formats correctly

- GIVEN a numeric value 1500.5
- WHEN `formatPrice(1500.5)` is called
- THEN it returns a string formatted as Argentinian pesos

## Acceptance Criteria

- [ ] All 9 entity interfaces and Zod schemas defined
- [ ] `import { Product, ProductSchema } from '@mbt/shared'` works
- [ ] Constants match the database enum values
- [ ] Format utilities produce correct output for AR locale

## Dependencies

- `monorepo-setup` — requires workspace resolution for `@mbt/shared`
