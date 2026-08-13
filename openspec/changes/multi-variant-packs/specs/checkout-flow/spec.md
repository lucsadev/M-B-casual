# Delta for checkout-flow

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec

## MODIFIED Requirements

### Requirement: Atomic order creation

On "Confirmar orden" the system MUST perform a transactional insert: INSERT into `orders`, INSERT into `order_items`, DELETE all `cart_items` for the user. The `create_order_from_cart` RPC MUST price pack products (`pack_units` NOT NULL) with the pack price split instead of `products.price` per row: per-row base unit price is `floor(total_cents / pack_units)` (integer cents), and the LAST row of the pack group absorbs the remainder (`total_cents mod pack_units` cents) in its subtotal, so the pack group's subtotals sum to `products.price` EXACTLY. Variant discounts keep applying per-row on the split base. This replaces the current behavior of pricing every row at the full `products.price` (which would overcharge a pack by N×).

(Previously: every `order_items` row was priced at `round(products.price × (1 − discount%))`, regardless of pack membership — a multi-row pack would charge N× the pack price.)

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

#### Scenario: Pack order is not overcharged (N× fix)

- GIVEN a cart with the 2 rows of a pack x2 product priced $20,000
- WHEN `create_order_from_cart` runs
- THEN each order item has unit price $10,000 AND the order total includes $20,000 for the pack (NOT $40,000)

#### Scenario: Pack remainder lands on the last row

- GIVEN a cart with the 3 rows of a pack x3 product priced $10,000
- WHEN `create_order_from_cart` runs
- THEN the order items have unit prices $3,333.33, $3,333.33, $3,333.34 AND the pack subtotals sum to $10,000.00 exactly

#### Scenario: Collapsed repeated variant prices per-unit with remainder

- GIVEN a cart with a single row (variant S, quantity 3) from a pack x3 product priced $10,000
- WHEN `create_order_from_cart` runs
- THEN the order item's subtotal is $10,000.00 exactly (base $3,333.33 × 3 plus the 1-cent remainder) AND its displayed unit price is $3,333.33

#### Scenario: Non-pack cart prices as before

- GIVEN a cart with a non-pack product priced $5,000, quantity 2
- WHEN `create_order_from_cart` runs
- THEN the order item has unit price $5,000, subtotal $10,000 AND the order total is unchanged from current behavior

#### Scenario: Pack with variant discount

- GIVEN a cart with a pack x2 product priced $20,000 where one row's variant has a 10% discount
- WHEN `create_order_from_cart` runs
- THEN the discounted row is priced at $9,000 (10% off its $10,000 split base) AND the pack subtotals sum to the discounted total
