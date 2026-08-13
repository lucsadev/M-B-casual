-- =============================================================================
-- 00007: Pack units column on products
--
-- Adds products.pack_units (smallint NULL): when non-NULL (2 or 3 in v1)
-- the product is a pack — products.price is the TOTAL pack price covering
-- N variant units the buyer must choose. NULL = not a pack (default today).
--
-- CHECK constraint rejects pack_units = 1 or 0 — only >= 2 is valid.
-- Admin UI offers only x2 / x3; the CHECK allows future sizes without a
-- new migration.
--
-- Additive and nullable: existing rows become NULL (unchanged behavior).
-- Rollback = drop column, no data migration, no destructive DDL.
-- =============================================================================

alter table public.products
  add column pack_units smallint;

alter table public.products
  add constraint products_pack_units_check
  check (pack_units is null or pack_units >= 2);

comment on column public.products.pack_units is
  'Pack size (x2/x3): number of variants the buyer must pick for the single pack price. NULL = not a pack.';
