# Delta for shared-package

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec

## ADDED Requirements

### Requirement: splitPackPrice utility

The package MUST export a `splitPackPrice` util from `utils/pack.ts`, re-exported via `utils/index.ts`, that splits a pack's total price into per-row amounts in integer cents whose sum equals the total EXACTLY. The util MUST accept the total price and pack units, plus the collapsed per-row quantities (default: N rows of quantity 1). Split rule: base per-unit = `floor(total_cents / pack_units)`; row subtotal = `base × row_quantity`; the LAST row absorbs `total_cents mod pack_units` cents in its subtotal. The util MUST reject `pack_units < 2`. This mirrors the authoritative `create_order_from_cart` pricing so display and checkout agree.

#### Scenario: Even split returns exact per-unit amounts

- GIVEN a total of $20,000 and pack units 2
- WHEN `splitPackPrice` is called
- THEN it returns per-row amounts of $10,000 and $10,000 (1,000,000 cents total)

#### Scenario: Odd total — remainder absorbed by last row

- GIVEN a total of $10,000 and pack units 3
- WHEN `splitPackPrice` is called
- THEN it returns 333,333 / 333,333 / 333,334 cents AND the sum equals 1,000,000 cents

#### Scenario: Collapsed quantity row keeps group total exact

- GIVEN a total of $10,000, pack units 3, and collapsed quantities [3] (one row)
- WHEN `splitPackPrice` is called
- THEN it returns a single amount of 1,000,000 cents (base 333,333 × 3 + 1-cent remainder) AND the displayed unit price is 333,333 cents

#### Scenario: Invalid pack units rejected

- GIVEN pack units 1 (or 0)
- WHEN `splitPackPrice` is called
- THEN it rejects with an error

## MODIFIED Requirements

### Requirement: TypeScript interfaces for all entities

The package MUST export TypeScript interfaces for: `Product`, `ProductVariant`, `Category`, `Order`, `OrderItem`, `Customer`, `Purchase`, `Expense`, `CashMovement`. Each interface MUST match the corresponding Supabase table schema. `Product` MUST include `packUnits?: number | null` (matching `products.pack_units`); the Zod product schema MUST validate it as a nullable integer ≥ 2 when present.

(Previously: `Product` had no pack field; the interface matched the schema before the `pack_units` column existed.)

#### Scenario: Product interface has required fields

- GIVEN the `Product` interface
- WHEN instantiated without `name` or `price`
- THEN TypeScript compilation MUST fail

#### Scenario: All entities are exported from index

- GIVEN the package entry point
- WHEN importing `@mbt/shared`
- THEN all 9 entity types are available

#### Scenario: Product interface exposes packUnits

- GIVEN the `Product` interface
- WHEN a pack product is typed
- THEN `packUnits` is present and typed as `number | null` (2 or 3 for packs, null otherwise)

#### Scenario: Invalid packUnits rejected by schema

- GIVEN a product object with `packUnits: 1`
- WHEN validated with the product schema
- THEN validation fails (pack units must be null or ≥ 2)
