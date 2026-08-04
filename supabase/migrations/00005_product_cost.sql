-- =============================================================================
-- 00005: Product cost tracking
--
-- Adds an optional `cost` column to `products` representing the purchase price
-- from the supplier (used to compute margins). Nullable, no default.
-- =============================================================================

alter table public.products
  add column cost numeric(10,2);

comment on column public.products.cost is
  'Costo del producto (precio de compra al proveedor). Opcional — usado para márgenes.';