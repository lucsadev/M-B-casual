# Cart Merge — Delta Specification

## Purpose

Allow anonymous users to maintain a local cart (React context / zustand) when not authenticated, and merge those items into the server-side `cart_items` upon login without duplication.

## ADDED Requirements

### Requirement: Anonymous local cart

The system MUST maintain cart items in local state (React context on web, React context or MMKV on mobile) when the user is NOT authenticated. All cart operations (add, increment, remove) SHALL work offline without server calls.

#### Scenario: Add item while logged out

- GIVEN a non-authenticated user browsing the catalog
- WHEN clicking "Agregar al carrito"
- THEN the item is stored in local state with product_id, variant_id, and quantity=1
- AND no API call is made to Supabase
- AND the cart count badge updates immediately

#### Scenario: Increment quantity while logged out

- GIVEN a non-authenticated user with an item already in local cart
- WHEN clicking "Agregar al carrito" on the same variant
- THEN the local quantity increments by 1

### Requirement: Cart merge on login

When authentication succeeds, the system MUST merge local cart items into `cart_items` via UPSERT on `(product_id, variant_id)`. Duplicates SHALL sum quantities. Local cart SHALL be cleared afterward.

#### Scenario: Local items UPSERTed into remote after login

- GIVEN a non-authenticated user with 3 items in local cart
- WHEN login succeeds
- THEN each local item is UPSERTed into `cart_items`
- AND if a product+variant combination already exists remotely, quantities are summed
- AND the local cart is cleared after the merge completes
- AND the TanStack Query cart cache is invalidated to reflect merged state

#### Scenario: Empty local cart skips merge

- GIVEN a user with an empty local cart
- WHEN logging in
- THEN no merge operation occurs
- AND the remote cart is loaded as-is

#### Scenario: Network error during merge leaves local cart intact

- GIVEN a user with local cart items
- WHEN login succeeds but the UPSERT mutation fails
- THEN the local cart items are preserved
- AND the user sees an error toast
- AND the merge can be retried

## MODIFIED Requirements

### Requirement: Add item to cart

The UI MUST provide an "Agregar al carrito" button on product detail and catalog. When authenticated, clicking SHALL upsert a row in `cart_items`. When anonymous, clicking SHALL store the item in local state.
(Previously: Always inserted into Supabase `cart_items`)

#### Scenario: Add new item when authenticated (unchanged)

- GIVEN an authenticated user with a selected variant
- WHEN clicking "Agregar al carrito"
- THEN a `cart_items` row is upserted with product_id, variant_id, and quantity=1
- AND the cart count badge increments

#### Scenario: Add item when anonymous (new)

- GIVEN a non-authenticated user
- WHEN clicking "Agregar al carrito"
- THEN the item is stored in local state context
- AND the cart count badge increments
- AND no server call is made
