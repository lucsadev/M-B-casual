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

The package MUST export `formatPrice` (ARS currency), `formatDate` (locale-aware), `generateSlug` (lowercase, hyphenated), and `generateSku` (deterministic SKU generation from category/product/size/color/ordinal tokens). `generateSku` MUST be re-exported via `utils/index.ts` and accept `{ categorySlug, productSlug, size?, color?, ordinal, used? }`, returning a SKU string conforming to `skuStringSchema`.

> *Delta from `auto-sku-generation`: previously `formatPrice`, `formatDate`, `generateSlug` were exported; no SKU util existed. Now `packages/shared/src/utils/sku.ts` adds `generateSku`, `slugifyToken`, `truncateToken`, and `MAX_RETRY_ATTEMPTS` (cap=100, mirrors DB trigger). `generateSlug` is reused for CAT/PROD slugification (idempotent on clean DB slugs); `slugifyToken` is Unicode-aware (preserves diacritics) for SIZE/COLOR3 tokens.*

#### Scenario: generateSku produces deterministic output

- GIVEN the same input params { categorySlug: "mujer", productSlug: "camisa-oversize", size: "M", color: "Blanco", ordinal: 1 }
- WHEN `generateSku` is called twice
- THEN both calls return the identical string `mujer-camisa-oversize-M-BLA-001`

#### Scenario: formatPrice formats correctly

- GIVEN a numeric value 1500.5
- WHEN `formatPrice(1500.5)` is called
- THEN it returns a string formatted as Argentinian pesos

### Requirement: SKU validation schema

> *Delta from `auto-sku-generation` (ADDED).* The package MUST export `skuStringSchema` (Zod string, `.max(100)` with regex `/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*-[A-Z0-9]+(?:-[A-Z]{3})?-\d{3}$/`) and `productVariantCreateSchema` (Zod object). `productVariantCreateSchema` MUST carry `id?` (uuid, optional), `size?` (string, optional), `color?` (string, optional), `discount?` (int 0–100, default 0), `stock` (int ≥ 0, default 0), `sku?` (string, optional — carried for upsert preservation, ignored on new create). Both MUST be re-exported via `validators/index.ts`.

> **Limitation (WARNING W1)**: `skuStringSchema` is ASCII-only and rejects diacritic color tokens (e.g. `…-ÍND-…`). Currently not applied to generated SKUs at any call site — latent only. See `sku-generation` spec for full note.

#### Scenario: Valid variant input passes schema

- GIVEN a variant object { size: "S", color: "Blanco", stock: 10 }
- WHEN validated with `productVariantCreateSchema`
- THEN it returns success (sku is auto-generated downstream, not validated here)

## Acceptance Criteria

- [ ] All 9 entity interfaces and Zod schemas defined
- [ ] `import { Product, ProductSchema } from '@mbt/shared'` works
- [ ] Constants match the database enum values
- [ ] Format utilities produce correct output for AR locale
- [ ] `generateSku` + `skuStringSchema` + `productVariantCreateSchema` exported from `@mbt/shared`

## Dependencies

- `monorepo-setup` — requires workspace resolution for `@mbt/shared`
