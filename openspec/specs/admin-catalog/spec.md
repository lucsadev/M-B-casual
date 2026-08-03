# Admin Catalog Specification

## Purpose

Admin panel for CRUD management of products, variants, images, and category assignment. Used by Marianela and Belén to maintain the catalog.

## Requirements

### Requirement: Product CRUD

Admins MUST create, read, update, and soft-delete (deactivate) products. Each product SHALL have: name, slug, description, price, optional compare_price, category, tags, and images.

#### Scenario: Create product with all fields

- GIVEN an authenticated admin user on the admin products page
- WHEN they complete the product form with valid data and submit
- THEN the product is persisted in `products` table AND the success toast is shown

#### Scenario: Deactivate product instead of hard delete

- GIVEN an active product with existing orders
- WHEN the admin toggles `is_active` to false
- THEN `is_active` becomes false AND the product disappears from public catalog

### Requirement: Variant management

Each product MUST support multiple variants with size, color, color_hex, and stock. **SKUs MUST be auto-generated on variant creation** — admins SHALL NOT manually enter or override SKUs. Admins MUST add, edit, and remove variants inline. The `updateProduct` flow MUST preserve existing variant SKUs by **upserting** (matching on variant ID), never deleting all variants and re-inserting.

> *Delta from `auto-sku-generation`: previously SKUs were manually entered by admins; `updateProduct` deleted all variants then re-inserted, wiping every SKU on each product edit. Now SKUs are auto-generated via the shared `generateSku` util (`packages/shared/src/utils/sku.ts`) and `updateProduct` reformed to upsert-by-variant.*

#### Scenario: Add variant without manual SKU input

- GIVEN a product without variants
- WHEN the admin adds variant "M / Negro" with stock 10 (no SKU field visible)
- THEN the variant is saved to `product_variants` with an auto-generated SKU (format `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`)

#### Scenario: Remove variant with orders

- GIVEN a variant referenced by existing orders
- WHEN the admin attempts to delete it
- THEN the system BLOCKS deletion with a constraint error message

#### Scenario: Edit preserves SKU

- GIVEN a product with variant SKU `mujer-camisa-oversize-M-BLA-001`
- WHEN the admin edits the variant's stock and saves (SKU is not visible or editable)
- THEN the variant retains SKU `mujer-camisa-oversize-M-BLA-001` unchanged

### Requirement: Image upload to Storage

Admins MUST upload multiple images per product to Supabase Storage `product-images` bucket. Uploads SHALL show progress feedback.

#### Scenario: Upload product image

- GIVEN an admin on the product form
- WHEN they select a valid image file (< 5MB)
- THEN the file uploads to `products/{productId}/{fileName}` AND a thumbnail preview appears

#### Scenario: Upload oversized file fails

- GIVEN an admin selecting a file > 5MB
- WHEN the upload is attempted
- THEN the system rejects with a size-limit error AND no file is stored

### Requirement: Category assignment

Products MUST be assignable to exactly one category (mujer, hombre, accesorios). Categories SHALL be loaded from the `categories` table.

#### Scenario: Product created with category

- GIVEN an admin creating a product
- WHEN they select "mujer" from the category dropdown
- THEN `category_id` references the "mujer" category row

## Acceptance Criteria

- [ ] Admin creates, edits, and deactivates products
- [ ] Variant CRUD works with stock tracking
- [ ] New variants get auto-generated SKUs (no manual SKU input visible)
- [ ] Editing a product preserves all existing variant SKUs (upsert-by-variant)
- [ ] Image uploads succeed to correct Storage path
- [ ] Category assignment saves correctly

## Dependencies

- `database-schema` — products, categories, product_variants tables
- `supabase-storage` — product-images bucket with admin RLS
- `shared-package` — Product, ProductVariant, Category types
- `sku-generation` — SKU auto-generation util (`generateSku`) and trigger fallback
