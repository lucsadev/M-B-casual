# Cart Web Specification

## Purpose

Enable the web customer to manage their shopping cart via a sidebar accessible from any page and a dedicated `/carrito` page. All mutations persist to Supabase via TanStack Query.

## Requirements

### Requirement: Add item to cart

The UI MUST provide an "Agregar al carrito" button on product detail and catalog. Clicking SHALL insert or upsert a row in `cart_items` for the authenticated user.

#### Scenario: Add new item from product detail

- GIVEN a product with selected variant
- WHEN the user clicks "Agregar al carrito"
- THEN a `cart_items` row is created with product_id, variant_id, and quantity=1
- AND the sidebar cart count increments

#### Scenario: Add same variant again increments quantity

- GIVEN an existing cart item for that variant
- WHEN the user clicks "Agregar al carrito" again
- THEN the existing row's quantity increases by 1

### Requirement: Cart sidebar

A slide-over panel SHALL show cart items, quantities, and totals. It MUST be accessible from any page via a cart icon in the header.

#### Scenario: Sidebar opens with current items

- GIVEN the user has items in cart
- WHEN clicking the cart icon in the header
- THEN a sidebar slides in with item list, quantity controls, and total
- AND a "Ver carrito completo" link navigates to `/carrito`

#### Scenario: Empty cart shows empty state

- GIVEN an empty cart
- WHEN opening the sidebar
- THEN it shows "Tu carrito está vacío" with a link to the catalog

### Requirement: Cart page (`/carrito`)

The `/carrito` page MUST display a full-width editable cart with quantity selectors, remove buttons, subtotal per item, shipping cost, and order total.

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
