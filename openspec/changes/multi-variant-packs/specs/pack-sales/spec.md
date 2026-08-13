# Pack Sales Specification

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec | Domain: `pack-sales` (NEW)

## Purpose

Let the store sell articles as packs (x2/x3 units, ONE published price covering the WHOLE pack). The buyer composes the pack at purchase time by picking N variants (repeats allowed), stock decrements from EVERY chosen variant, and pricing is split so the sum of rows equals the published pack price exactly. Web-only in v1: the mobile app (storefront pack builder, mobile cart, mobile admin form) is paused by the owner until further notice and MUST NOT be implemented in this change.

## Requirements

### Requirement: Pack product definition

A product is a pack when `products.pack_units` is NOT NULL (2 or 3 in v1; NULL = not a pack). `products.price` SHALL represent the TOTAL price of the whole pack, never a per-unit price. The system MUST treat a non-pack product (`pack_units IS NULL`) exactly as today.

#### Scenario: Pack product carries a size

- GIVEN an admin marks a product as pack x2
- WHEN the product is saved
- THEN `products.pack_units = 2` AND `products.price` is interpreted as the total pack price

#### Scenario: Non-pack product has no marker

- GIVEN a product never marked as pack
- WHEN it is saved
- THEN `products.pack_units IS NULL` AND its price is interpreted as a unit price

### Requirement: Pack selection builder (storefront web)

The product detail page MUST render a pack builder for pack products: exactly N variant slots (one per unit). Each slot MUST allow choosing any variant of the product. The add-to-cart action MUST be disabled until ALL N slots are filled with in-stock variants (all-or-nothing — a pack can never be added partially). A slot whose selected variant has insufficient stock SHALL block confirmation and show an insufficient-stock state. Repeated variants MUST be allowed when stock allows (e.g. "2x Talle S Negro"); before insertion the builder MUST collapse repeats into a `Map<variantId, quantity>` so no duplicate cart rows are created for the same variant.

#### Scenario: Complete pack can be added

- GIVEN a pack x2 product with variants S and M in stock
- WHEN the buyer fills slot 1 with S and slot 2 with M
- THEN add-to-cart is enabled AND clicking it inserts 2 cart rows (S, M)

#### Scenario: Incomplete pack cannot be added

- GIVEN a pack x2 product
- WHEN only 1 of 2 slots is filled
- THEN add-to-cart remains disabled

#### Scenario: Out-of-stock slot blocks the pack

- GIVEN a pack x2 product whose M variant has stock 0
- WHEN the buyer selects M in a slot
- THEN the slot shows the insufficient-stock state AND add-to-cart stays disabled

#### Scenario: Repeated variant collapses to quantity

- GIVEN a pack x3 product with stock 5 on S
- WHEN the buyer fills all 3 slots with S
- THEN exactly 1 cart row is created with quantity 3 for variant S

### Requirement: Split pack pricing

The system MUST price pack rows so that the SUM of the pack rows' subtotals equals `products.price` EXACTLY. The authoritative split SHALL be computed in integer cents: base per-unit = `floor(total_cents / pack_units)`; each row's subtotal = `base × row_quantity`; the LAST row of the pack group absorbs the remainder `total_cents mod pack_units` cents into its subtotal (so a collapsed quantity-k last row still keeps the group exact). Derived per-row unit prices are rounded to cents for display and may differ from `subtotal / quantity` by at most 1 cent. Variant discounts MUST keep applying per-row on the split base (mixed-discount drift of at most N cents is accepted and documented).

#### Scenario: Even split

- GIVEN a pack x2 product priced $20,000 with 2 filled rows
- WHEN the pack rows are priced
- THEN each row has unit price $10,000 AND the subtotals sum to $20,000

#### Scenario: Odd total — remainder absorbed by last row

- GIVEN a pack x3 product priced $10,000 with 3 filled rows
- WHEN the pack rows are priced
- THEN unit prices are $3,333.33, $3,333.33, and $3,333.34 AND the subtotals sum to $10,000.00

#### Scenario: Discount applies on the split base

- GIVEN a pack x2 product priced $20,000 where one variant has a 10% discount
- WHEN the pack rows are priced
- THEN the discounted row is priced at $9,000 (10% off its $10,000 split base) AND the sum equals the discounted pack total

#### Scenario: All-repeated pack keeps the group total exact

- GIVEN a pack x3 product priced $10,000 whose 3 slots are all the same variant (collapses to one row, quantity 3)
- WHEN the row is priced
- THEN the row's subtotal is $10,000.00 exactly (base $3,333.33 × 3 plus the 1-cent remainder) AND its displayed unit price is $3,333.33

### Requirement: Cart pack grouping (web)

Cart display (sidebar and `/carrito` page) MUST visually group the rows of a pack product under a "Pack xN" badge. Split prices SHALL be displayed per row (via the shared `splitPackPrice` util) and the group SHALL show the pack total equal to `products.price`.

#### Scenario: Pack rows render grouped

- GIVEN a cart containing the 3 rows of a pack x3 product
- WHEN the cart is displayed
- THEN the 3 rows appear grouped under a "Pack x3" header with per-row split prices AND a group total equal to the pack price

#### Scenario: Collapsed repeated row shows quantity

- GIVEN a pack row with quantity 3 (repeated variant collapsed) in a $10,000 x3 pack
- WHEN the cart is displayed
- THEN the row shows quantity 3 AND a subtotal equal to the pack total ($10,000.00, including the absorbed remainder)

### Requirement: In-person sales pack picker

The in-person sales variant picker MUST be pack-aware: for a pack product it SHALL present N slots (one per unit, repeats allowed) and price the resulting line items from the split pack price so they sum to `products.price`. Stock validation SHALL remain the existing atomic `BEFORE INSERT` trigger on `in_person_sale_items` — a sale item referencing a variant with insufficient stock MUST fail atomically. Confirmation MUST be blocked until all N slots are filled.

#### Scenario: Pack sale prices rows to the pack total

- GIVEN an admin processing an in-person sale for a pack x2 product priced $20,000
- WHEN they fill the 2 slots with variants S and M and confirm
- THEN 2 sale line items are created with unit price $10,000 each AND subtotals summing to $20,000

#### Scenario: Pack sale with insufficient stock fails atomically

- GIVEN a pack x2 product where variant M has stock 0
- WHEN the admin confirms a sale containing M
- THEN the sale is rejected by the trigger AND no partial stock decrement or partial sale is persisted

### Requirement: Admin order guard

The admin manual-order form MUST NOT allow adding pack products (`pack_units IS NOT NULL`) as line items in v1. Selecting a pack product SHALL be blocked with an explanatory message. Pack building in admin orders is deferred to a follow-up.

#### Scenario: Pack product blocked in admin order form

- GIVEN an admin on the manual-order form
- WHEN they try to pick a pack x2 product
- THEN the form blocks the selection AND shows an explanatory message AND no pack line item is added

### Requirement: Single-product flows unchanged (regression)

Pack support MUST NOT alter any behavior for non-pack products in the storefront, cart, checkout, in-person sales, or admin order flows.

#### Scenario: Single product checkout prices as today

- GIVEN a cart with a non-pack product priced $5,000, quantity 2
- WHEN the order is created
- THEN the order item has unit price $5,000, subtotal $10,000 AND the order total matches today's calculation

## Acceptance Criteria

- [ ] Pack rows' subtotals sum to `products.price` exactly (remainder absorbed by last row)
- [ ] Repeated variants collapse to one cart row with quantity
- [ ] All-or-nothing: add-to-cart/confirm disabled until N slots filled with in-stock variants
- [ ] In-person pack sale rows price to the pack total; insufficient stock fails atomically
- [ ] Admin order form blocks pack products with an explanatory message
- [ ] Non-pack flows behave identically to before (regression pass)

## Out of Scope

- Admin manual-order pack builder (deferred; guard ships in v1)
- Partial packs ("buy 1 unit of a pack") — rejected policy
- Dynamic packs ("pick any 3 of these 5") — requires a composition model
- Pack-aware grouping in order history (split rows are acceptable)
- Mobile app (storefront pack builder, mobile cart, mobile admin form) — paused by owner
- Mobile in-person sales (feature does not exist)

## Dependencies

- `database-schema` — `products.pack_units` column + CHECK
- `shared-package` — `splitPackPrice` util and `Product.packUnits`
- `admin-catalog` — product form pack marking (web)
- `checkout-flow` — pack-aware `create_order_from_cart` pricing
