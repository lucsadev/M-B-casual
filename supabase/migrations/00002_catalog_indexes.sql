-- =============================================================
-- M&B Trend — Catalog Performance Indexes
-- Migration: 00002_catalog_indexes.sql
-- Description: Enable pg_trgm extension, add trigram search
--              index on products.name, composite indexes for
--              catalog queries, and variant lookups.
-- Fase 1: Catalog — Foundation
-- =============================================================

-- =============================================================
-- 1. EXTENSION — pg_trgm for fuzzy text search
-- =============================================================
create extension if not exists pg_trgm with schema extensions;

-- =============================================================
-- 2. INDEXES
-- =============================================================

-- 2.1  GIN trigram index for ILIKE / similarity search on product names
--      Supports: SELECT * FROM products WHERE name ILIKE '%query%'
--      This supplements the existing FTS index (00001_initial.sql)
--      which uses to_tsvector('spanish', name).
create index concurrently if not exists idx_products_name_trgm
  on products using gin (name gin_trgm_ops);

-- 2.2  Composite index for filtered catalog queries
--      Supports: SELECT * FROM products
--                  WHERE category_id = $1 AND is_active = true
--                  ORDER BY created_at DESC
--                  LIMIT $2 OFFSET $3
create index concurrently if not exists idx_products_catalog_query
  on products (category_id, is_active, created_at desc);

-- 2.3  Partial index for active-only product lookups
--      Thin index covering only active rows for dashboard/admin queries
create index concurrently if not exists idx_products_active_only
  on products (created_at desc) where is_active = true;

-- 2.4  Product variants by product (covering index for stock queries)
--      Supports: SELECT size, color, stock, sku FROM product_variants
--                  WHERE product_id = $1
create index concurrently if not exists idx_variants_lookup
  on product_variants (product_id) include (size, color, stock, sku);

-- =============================================================
-- 3. COMMENTS
-- =============================================================
comment on extension pg_trgm is 'Trigram text search for ILIKE queries on product names';
comment on index idx_products_name_trgm is 'GIN trigram index for fast ILIKE search on products.name';
comment on index idx_products_catalog_query is 'Composite index for filtered catalog queries (category + active + date)';
comment on index idx_products_active_only is 'Partial index for active-only product listings';
comment on index idx_variants_lookup is 'Covering index for variant lookups by product_id (includes size, color, stock, sku)';
