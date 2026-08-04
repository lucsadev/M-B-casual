-- =============================================================================
-- 00004: Suppliers (proveedores) + product-supplier relations
--
-- Adds a suppliers table for managing supply contacts and a product_suppliers
-- join table so each product can be associated with one or more suppliers.
--
-- Both tables are internal (admin-managed only): no public/anon access, RLS
-- gated on is_admin() like purchases, expenses and cash_movements.
-- =============================================================================

-- 1. Suppliers table
create table public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  contact_name text,
  email        text,
  phone        text,
  address      text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.suppliers is
  'Proveedores: contactos de abastecimiento para productos y compras.';
comment on column public.suppliers.name is
  'Nombre del proveedor.';
comment on column public.suppliers.contact_name is
  'Persona de contacto dentro del proveedor (opcional).';
comment on column public.suppliers.email is
  'Email de contacto del proveedor (opcional).';
comment on column public.suppliers.phone is
  'Teléfono de contacto del proveedor (opcional).';
comment on column public.suppliers.address is
  'Dirección del proveedor (opcional).';
comment on column public.suppliers.is_active is
  'Indica si el proveedor está activo para nuevas asociaciones.';

-- 2. Product-supplier join table
create table public.product_suppliers (
  product_id  uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (product_id, supplier_id)
);

create index product_suppliers_supplier_id_idx
  on public.product_suppliers (supplier_id);

comment on table public.product_suppliers is
  'Relación muchos a muchos entre productos y proveedores.';

-- 3. Auto updated_at (matches trg_products_updated_at pattern)
create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row
  execute function set_updated_at();

-- 4. RLS: admin-only management (internal tables — no public read)
alter table public.suppliers enable row level security;
alter table public.product_suppliers enable row level security;

create policy "Admin can manage suppliers"
  on public.suppliers for all
  using (is_admin())
  with check (is_admin());

create policy "Admin can manage product_suppliers"
  on public.product_suppliers for all
  using (is_admin())
  with check (is_admin());

-- 5. Grants (internal tables — authenticated only, admin enforced via RLS)
grant all on public.suppliers to authenticated;
grant all on public.product_suppliers to authenticated;
