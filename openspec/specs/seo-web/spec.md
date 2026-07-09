# SEO Web Specification

## Purpose

Dynamic meta tags, Open Graph, Schema.org JSON-LD, sitemap.xml, and robots.txt for the web app.

## Requirements

### Requirement: Dynamic meta tags per route

Every route MUST use `react-helmet-async` to set unique `<title>`, `<meta name="description">`, and canonical URL. The `<head>` SHALL NOT contain hardcoded per-page tags in `index.html`.

#### Scenario: Home page meta

- GIVEN a crawler visiting the home page `/`
- WHEN the page renders
- THEN `<title>` is "M&B Trend — Indumentaria y Accesorios" AND a meta description exists

#### Scenario: Product detail meta

- GIVEN a crawler visiting `/producto/remera-negra`
- WHEN the page renders
- THEN `<title>` contains the product name AND canonical URL matches the current URL

### Requirement: Open Graph tags

Product pages MUST emit `og:title`, `og:description`, `og:image`, `og:url`, and `og:type="product"`. Catalog pages SHALL emit `og:title` and `og:description`.

#### Scenario: Product shared on social media

- GIVEN a product page shared on Facebook
- WHEN the link preview is generated
- THEN `og:image` is the product image AND `og:description` is the product description

### Requirement: Schema.org JSON-LD

Product pages MUST include JSON-LD structured data for Product with `name`, `description`, `image`, `offers` (price, currency, availability).

#### Scenario: Google rich results for product

- GIVEN a Google crawler visiting a product page
- WHEN inspecting the JSON-LD script tag
- THEN `@type` is "Product" AND `offers.price` matches the product price AND `offers.availability` matches stock status

### Requirement: Sitemap and robots

The app MUST serve `robots.txt` and `sitemap.xml` from `/public`. Sitemap SHALL include all active product URLs and catalog pages. `robots.txt` SHALL allow all crawlers and point to the sitemap.

#### Scenario: Crawler fetches sitemap

- GIVEN a search engine crawler
- WHEN requesting `/sitemap.xml`
- THEN the response is valid XML with product and catalog URLs AND HTTP status is 200
