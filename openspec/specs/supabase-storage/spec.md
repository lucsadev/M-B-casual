# Supabase Storage Specification

## Purpose

Configure Supabase Storage buckets for product images and expense receipts with appropriate access policies.

## Requirements

### Requirement: Product images bucket

A public bucket `product-images` MUST allow anonymous SELECT (read) and admin-only INSERT/UPDATE/DELETE. File size MUST be limited to 5MB per upload.

#### Scenario: Anonymous user views product image

- GIVEN a publicly accessible image URL in `product-images`
- WHEN an unauthenticated browser requests the URL
- THEN the image is served successfully

#### Scenario: Anonymous user cannot upload

- GIVEN an unauthenticated request to upload to `product-images`
- WHEN `supabase.storage.from('product-images').upload()` is called
- THEN the request is rejected with a 401 or 403

### Requirement: Receipts bucket

A bucket `receipts` MUST be admin-only for all operations (SELECT, INSERT, UPDATE, DELETE). Receipts are never public.

#### Scenario: Admin can upload receipt

- GIVEN an admin authenticated user
- WHEN uploading a receipt to `receipts/{expenseId}/`
- THEN the upload succeeds and returns a public URL

### Requirement: Folder structure

Files in `product-images` MUST be organized as `products/{productId}/{fileName}`. Files in `receipts` as `receipts/{expenseId}/{fileName}`.

#### Scenario: Upload uses correct path

- GIVEN product ID `abc-123` and file `front.jpg`
- WHEN uploaded via `supabase.storage.from('product-images').upload('products/abc-123/front.jpg', ...)`
- THEN the file is stored at the exact path `products/abc-123/front.jpg`

## Acceptance Criteria

- [ ] `product-images` bucket accessible for reading by anonymous users
- [ ] Only admin can upload/delete in both buckets
- [ ] Folder structure enforced via application code conventions

## Dependencies

- `database-schema` — `products` and `expenses` tables must exist
- `supabase-auth` — admin role must be defined for RLS
