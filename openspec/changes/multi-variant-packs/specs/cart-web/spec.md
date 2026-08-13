# Delta for cart-web

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec

## MODIFIED Requirements

### Requirement: Add item to cart

The UI MUST provide an "Agregar al carrito" button on product detail and catalog. Clicking SHALL insert or upsert a row in `cart_items` for the authenticated user. For a pack product, the pack builder's single add-to-cart action SHALL insert one `cart_items` row per distinct chosen variant (repeats collapsed into the row's quantity, as specified in `pack-sales`); the existing upsert-by-(user, product, variant) behavior then accumulates quantity as today.

(Previously: every add-to-cart produced exactly one row for one variant, quantity 1.)

#### Scenario: Add new item from product detail

- GIVEN a product with selected variant
- WHEN the user clicks "Agregar al carrito"
- THEN a `cart_items` row is created with product_id, variant_id, and quantity=1
- AND the sidebar cart count increments

#### Scenario: Add same variant again increments quantity

- GIVEN an existing cart item for that variant
- WHEN the user clicks "Agregar al carrito" again
- THEN the existing row's quantity increases by 1

#### Scenario: Pack add produces one row per distinct variant

- GIVEN a completed pack x3 selection with variants [S, S, M]
- WHEN the user clicks the pack add-to-cart action
- THEN 2 `cart_items` rows are created: S with quantity 2 AND M with quantity 1

### Requirement: Cart sidebar

A slide-over panel SHALL show cart items, quantities, and totals. It MUST be accessible from any page via a cart icon in the header. Pack rows SHALL be visually grouped with a "Pack xN" badge and show split prices exactly as on the `/carrito` page.

(Previously: the sidebar listed rows without any pack awareness.)

#### Scenario: Sidebar opens with current items

- GIVEN the user has items in cart
- WHEN clicking the cart icon in the header
- THEN a sidebar slides in with item list, quantity controls, and total
- AND a "Ver carrito completo" link navigates to `/carrito`

#### Scenario: Empty cart shows empty state

- GIVEN an empty cart
- WHEN opening the sidebar
- THEN it shows "Tu carrito está vacío" with a link to the catalog

#### Scenario: Pack rows grouped in sidebar

- GIVEN a cart with the 2 rows of a pack x2 product
- WHEN opening the sidebar
- THEN the rows appear grouped under a "Pack x2" badge with split unit prices

### Requirement: Cart page (`/carrito`)

The `/carrito` page MUST display a full-width editable cart with quantity selectors, remove buttons, subtotal per item, shipping cost, and order total. Pack rows MUST be grouped under a "Pack xN" badge with per-row split prices (via the shared `splitPackPrice` util) and the group total MUST equal `products.price` exactly.

(Previously: the page listed independent rows with no grouping and no pack pricing.)

#### Scenario: Update quantity on cart page

- GIVEN an item in the cart list
- WHEN the user increments the quantity
- THEN TanStack Query mutation updates `cart_items` and the subtotal recalculates

#### Scenario: Remove item from cart

- GIVEN an item in the cart list
- WHEN the user clicks the remove/trash button
- THEN TanStack Query mutation deletes the `cart_items` row
- AND the item is removed from the list with a confirmation toast

#### Scenario: Checkout button navigates to checkout

- GIVEN items in the cart
- WHEN the user clicks "Iniciar checkout"
- THEN the app navigates to `/checkout`

#### Scenario: Pack group shows exact split pricing

- GIVEN a pack x3 product priced $10,000 whose 3 rows are in the cart
- WHEN the cart page renders the group
- THEN the rows show unit prices $3,333.33, $3,333.33, $3,333.34 AND the group total equals $10,000.00

#### Scenario: Collapsed repeated row shows quantity and subtotal

- GIVEN a pack x3 product priced $10,000 whose selection collapsed to a single row (quantity 3)
- WHEN the cart page renders it
- THEN the row shows quantity 3, unit price $3,333.33, AND subtotal $10,000.00 (the group's 1-cent remainder is absorbed into this last row's subtotal)
