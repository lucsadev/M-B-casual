# Catalog Display Web Specification

## Purpose

Public-facing web catalog: responsive product grid with category filtering, search, pagination, and a product detail page with variant selector.

## Requirements

### Requirement: Product grid with pagination

The web catalog MUST display active products in a responsive grid. Grid SHALL paginate with offset-based pagination (12 items per page default).

#### Scenario: Load catalog page 1

- GIVEN a visitor on `/catalogo`
- WHEN the page loads
- THEN 12 products are displayed AND a "Show more" / page controls are visible if more exist

#### Scenario: Empty catalog

- GIVEN no active products exist
- WHEN visiting the catalog page
- THEN the grid shows "No products found" with an illustration

### Requirement: Category filter

Visitors MUST filter the catalog by category (mujer, hombre, accesorios) via URL query params. Filtering SHALL reset pagination to page 1.

#### Scenario: Filter by category

- GIVEN a visitor on `/catalogo`
- WHEN they click "Hombre"
- THEN the URL changes to `/catalogo?category=hombre` AND only products with that category are shown

#### Scenario: Invalid category param

- GIVEN a visitor with `/catalogo?category=invalida`
- WHEN the page loads
- THEN it falls back to showing all products WITHOUT error

### Requirement: Product search by name

Visitors MUST search products by name. The system SHALL use `ILIKE` search or trigram indexes.

#### Scenario: Search finds matching products

- GIVEN a visitor on the catalog
- WHEN they type "remera" in the search box
- THEN products with "remera" in the name are displayed

#### Scenario: Search with no results

- GIVEN a visitor searching "producto-inexistente"
- WHEN the search completes
- THEN "No results for your search" message is shown

### Requirement: Product detail page

Each product MUST have a dedicated page at `/producto/:slug` showing: name, price, description, image gallery, and variant selector (size/color) with stock indicator.

#### Scenario: View product detail

- GIVEN a visitor on a product detail page
- WHEN they select size "M" and color "Negro"
- THEN the UI shows the available stock for that variant AND the price

#### Scenario: Out-of-stock variant

- GIVEN a product with a variant where stock = 0
- WHEN a visitor views the detail
- THEN the variant SHALL show "Out of stock" AND the add-to-cart button SHALL be disabled

### Requirement: SEO meta tags

Each catalog page MUST emit appropriate `<title>` and `<meta name="description">`. Product pages SHALL use the product name and truncated description.

#### Scenario: Product page has meta tags

- GIVEN a visitor viewing product "Remera Negra"
- WHEN inspecting the page `<head>`
- THEN `<title>` contains "Remera Negra" AND a meta description exists

## Acceptance Criteria

- [ ] Grid displays products with correct pagination
- [ ] Category filters update URL and results
- [ ] Search finds by name (ILIKE)
- [ ] Detail page shows variant selector with stock
- [ ] Meta tags set per page

## Dependencies

- `admin-catalog` — requires products in the database
- `api-catalog-layer` — uses shared hooks and client
