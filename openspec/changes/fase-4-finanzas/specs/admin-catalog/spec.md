# Delta for Admin Catalog

## MODIFIED Requirements

### Requirement: Variant management

Each product MUST support multiple variants with size, color, color_hex, stock, and SKU. Admins MUST add, edit, and remove variants inline. Stock is updated by admin edits AND by purchase confirmations — increments from purchase items MUST atomically add to the current stock value.
(Previously: Stock was only updated via manual admin variant edits)

#### Scenario: Add variant with stock (unchanged)
- GIVEN a product without variants
- WHEN the admin adds variant "M / Negro / SKU-001" with stock 10
- THEN the variant is saved to `product_variants` linked to the product

#### Scenario: Purchase confirmation increments existing stock (new)
- GIVEN variant "M — Negro" with current stock 10
- WHEN a purchase is confirmed with variant_id = variant.id and quantity = 5
- THEN `product_variants.stock` becomes 15 (10 + 5)

#### Scenario: Remove variant with orders (unchanged)
- GIVEN a variant referenced by existing orders
- WHEN the admin attempts to delete it
- THEN the system BLOCKS deletion with a constraint error message

#### Scenario: Concurrent purchase + admin edit do not overlap (new)
- GIVEN variant stock = 10
- WHEN a purchase confirm (qty 5) and an admin edit (set stock to 20) happen simultaneously
- THEN stock ends as either 25 (purchase atomic add on 20) or 15 (admin edit then purchase add)
- AND stock SHALL never be negative or incorrect due to race (use atomic `UPDATE stock = stock + N`)