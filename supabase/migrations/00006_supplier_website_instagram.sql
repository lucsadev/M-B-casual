-- =============================================================================
-- 00006: Replace supplier contact person with web + instagram fields
--
-- Drops the contact_name column and adds website/instagram so each supplier
-- can carry a web address and an Instagram profile instead.
-- =============================================================================

alter table public.suppliers
  drop column contact_name,
  add column website text,
  add column instagram text;

comment on column public.suppliers.website is
  'Dirección web del proveedor (opcional).';
comment on column public.suppliers.instagram is
  'Perfil de Instagram del proveedor (opcional).';
