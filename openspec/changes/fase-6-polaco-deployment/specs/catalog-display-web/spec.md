# Delta for catalog-display-web

## MODIFIED Requirements

### Requirement: SEO meta tags

Each catalog page MUST emit unique `<title>` and `<meta name="description">` via `react-helmet-async`. Product pages SHALL include Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`). The `<head>` SHALL be managed per-route, not in `index.html`.
(Previously: Basic static meta tags via index.html)

#### Scenario: Product page has full meta + OG tags

- GIVEN a visitor viewing product "Remera Negra" with an image
- WHEN inspecting the page `<head>`
- THEN `<title>` contains "Remera Negra" AND `<meta property="og:title">` matches AND `<meta property="og:image">` contains the product image URL

#### Scenario: Catalog listing has paginated meta

- GIVEN a visitor on `/catalogo?page=2`
- WHEN the page renders
- THEN `<title>` includes "Page 2" AND `<meta name="robots">` includes "noindex" for paginated pages

## REMOVED Requirements

### Requirement: SEO meta tags (original)

(Reason: Replaced by upgraded `react-helmet-async` requirement with Open Graph support)
