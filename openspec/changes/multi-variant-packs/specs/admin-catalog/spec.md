# Delta for admin-catalog

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec

## MODIFIED Requirements

### Requirement: Product CRUD

Admins MUST create, read, update, and soft-delete (deactivate) products. Each product SHALL have: name, slug, description, price, optional compare_price, category, tags, images, and an optional pack marking. The product form (web) MUST offer a "Venta en pack" toggle; when enabled, a pack-size select SHALL offer only x2 and x3. The chosen value MUST be persisted as `products.pack_units` on both create and update (NULL when the toggle is off). The price semantics change accordingly: for a pack product, `products.price` is the TOTAL pack price.

(Previously: products had name, slug, description, price, optional compare_price, category, tags, and images — no pack concept existed in the form or the data model.)

#### Scenario: Create product with all fields

- GIVEN an authenticated admin user on the admin products page
- WHEN they complete the product form with valid data and submit
- THEN the product is persisted in `products` table AND the success toast is shown

#### Scenario: Deactivate product instead of hard delete

- GIVEN an active product with existing orders
- WHEN the admin toggles `is_active` to false
- THEN `is_active` becomes false AND the product disappears from public catalog

#### Scenario: Mark product as pack on create

- GIVEN an admin creating a product
- WHEN they enable "Venta en pack", select size x2, and submit
- THEN the product is persisted with `pack_units = 2`

#### Scenario: Pack size persists on update

- GIVEN an existing product with `pack_units = 2`
- WHEN the admin edits the price (still marked x2) and saves
- THEN `pack_units` remains 2 AND the new price is stored as the total pack price

#### Scenario: Toggle off clears the marker

- GIVEN a product with `pack_units = 3`
- WHEN the admin disables "Venta en pack" and saves
- THEN `pack_units` is persisted as `NULL` AND the product is treated as a non-pack product

#### Scenario: Only x2 and x3 are offered

- GIVEN the pack-size select is visible
- WHEN the admin opens it
- THEN the only selectable sizes are x2 and x3

#### Scenario: Non-pack product keeps NULL

- GIVEN an existing non-pack product
- WHEN the admin edits any field without enabling "Venta en pack" and saves
- THEN `pack_units` remains `NULL`
