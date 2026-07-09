# Image Optimization Web Specification

## Purpose

Automatic WebP generation, native lazy loading, and skeleton placeholders for all product images on the web app.

## Requirements

### Requirement: WebP with fallback

Product images MUST output WebP format at build time via a Vite plugin. Browsers that don't support WebP SHALL receive the original format as fallback via `<picture>` element.

#### Scenario: Browser supports WebP

- GIVEN a Chrome user viewing a product page
- WHEN the browser requests a product image
- THEN the response is WebP format AND the file size is under 200KB

#### Scenario: Old browser without WebP

- GIVEN an older Safari user viewing a product page
- WHEN the page renders
- THEN the `<picture>` element falls back to JPEG/PNG AND the image displays correctly

### Requirement: Lazy loading with skeleton

Images MUST use native `loading="lazy"` attribute and SHOW a skeleton placeholder (CSS-only shimmer) while loading. The system SHOULD provide a `<OptimizedImage>` component that wraps `<picture>`, lazy, and skeleton.

#### Scenario: Image below the fold

- GIVEN a visitor scrolling the catalog
- WHEN an image enters the viewport
- THEN the image loads with a skeleton placeholder showing until the image resolves

#### Scenario: Image failed to load

- GIVEN a broken or missing image URL
- WHEN the `<OptimizedImage>` component renders
- THEN a fallback placeholder icon is shown (not a broken image icon)
