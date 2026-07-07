-- =============================================================
-- M&B Trend — Seed Data
-- File: seed.sql
-- Description: Storage buckets and initial seed data
-- Usage: Execute after migration via Supabase CLI or Dashboard SQL
--   supabase db seed  (local)
--   OR paste into Dashboard SQL Editor
-- =============================================================

-- =============================================================
-- 1. STORAGE BUCKETS
-- =============================================================

-- 1.1  product-images — Public bucket for product photos
--      Path pattern: products/{productId}/{fileName}
--      Public SELECT: anyone can view product images
--      INSERT/UPDATE: admin only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- 1.2  receipts — Private bucket for expense receipts
--      Path pattern: receipts/{expenseId}/{fileName}
--      All operations: admin only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- =============================================================
-- 2. STORAGE RLS POLICIES
-- =============================================================

-- 2.1  product-images: public read, admin write
create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admin can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.jwt() ->> 'role' = 'admin'
  );

create policy "Admin can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.jwt() ->> 'role' = 'admin'
  )
  with check (
    bucket_id = 'product-images'
    and auth.jwt() ->> 'role' = 'admin'
  );

create policy "Admin can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.jwt() ->> 'role' = 'admin'
  );

-- 2.2  receipts: admin only (all operations)
create policy "Admin can view receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.jwt() ->> 'role' = 'admin'
  );

create policy "Admin can upload receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.jwt() ->> 'role' = 'admin'
  );

create policy "Admin can update receipts"
  on storage.objects for update
  using (
    bucket_id = 'receipts'
    and auth.jwt() ->> 'role' = 'admin'
  )
  with check (
    bucket_id = 'receipts'
    and auth.jwt() ->> 'role' = 'admin'
  );

create policy "Admin can delete receipts"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.jwt() ->> 'role' = 'admin'
  );
