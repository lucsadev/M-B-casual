-- =============================================================
-- M&B Trend — Storage Seed Data
-- Description: Creates storage buckets and RLS policies for
--              product images and expense receipts.
-- NOTE: This file is executed AFTER migrations via seed.sql.
-- Storage bucket creation cannot be done in migrations because
-- the storage schema is managed separately by Supabase.
-- =============================================================

-- =============================================================
-- 1. BUCKETS
-- =============================================================

-- Create product-images bucket (public read, admin write)
insert into storage.buckets (id, name, public, created_at)
values ('product-images', 'product-images', true, now())
  on conflict (id) do nothing;

-- Create receipts bucket (admin only)
insert into storage.buckets (id, name, public, created_at)
values ('receipts', 'receipts', false, now())
  on conflict (id) do nothing;

-- =============================================================
-- 2. STORAGE RLS POLICIES
-- =============================================================

-- 2.1  Product Images — Public bucket
--      Anyone can view product images
--      Only admin can upload, update, or delete

create policy "product-images-public-select"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product-images-admin-insert"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

create policy "product-images-admin-update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  )
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

create policy "product-images-admin-delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

-- 2.2  Receipts — Private bucket
--      Only admin can view, upload, update, or delete

create policy "receipts-admin-select"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

create policy "receipts-admin-insert"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

create policy "receipts-admin-update"
  on storage.objects for update
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  )
  with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

create policy "receipts-admin-delete"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

-- =============================================================
-- 3. VERIFICATION (quiet — no output expected)
-- =============================================================
-- Run these manually to verify:
-- select id, name, public from storage.buckets;
-- select * from storage.policies;
