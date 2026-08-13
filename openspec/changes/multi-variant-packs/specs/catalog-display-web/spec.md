# Delta for catalog-display-web

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec

## MODIFIED Requirements

### Requirement: Product detail page

Each product MUST have a dedicated page at `/producto/:slug` showing: name, price, description, image gallery, and a variant selector (size/color) with stock indicator. For pack products (`pack_units` NOT NULL) the page MUST instead render a pack builder with exactly N variant slots (N = `pack_units`) — full pack-selection behavior (repeats allowed, all-or-nothing, stock-aware) is specified in the `pack-sales` spec; the page SHALL display the total pack price.

(Previously: the detail page showed a single-variant selector only; pack products had no distinct representation.)

#### Scenario: View product detail

- GIVEN a visitor on a product detail page
- WHEN they select size "M" and color "Negro"
- THEN the UI shows the available stock for that variant AND the price

#### Scenario: Out-of-stock variant

- GIVEN a product with a variant where stock = 0
- WHEN a visitor views the detail
- THEN the variant SHALL show "Out of stock" AND the add-to-cart button SHALL be disabled

#### Scenario: Pack product shows N slots

- GIVEN a product with `pack_units = 3`
- WHEN a visitor views the detail page
- THEN the page renders 3 pack slots AND displays the total pack price (no per-unit price)

#### Scenario: Add-to-cart disabled until pack complete

- GIVEN a pack x2 product on the detail page
- WHEN fewer than 2 slots are filled with in-stock variants
- THEN the add-to-cart button remains disabled

#### Scenario: Repeated variant selectable in multiple slots

- GIVEN a pack x2 product with variant S in stock
- WHEN the visitor selects S in both slots
- THEN the builder accepts the selection (no duplicate-key error) AND add-to-cart becomes enabled
