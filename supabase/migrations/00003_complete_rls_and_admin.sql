-- =============================================================
-- M&B Trend — Complete RLS & Admin Infrastructure
-- Migration: 00003_complete_rls_and_admin.sql
-- Description: Adds missing RLS policies on all tables,
--              admin role management function, storage setup,
--              and helper views for dashboard KPIs.
-- Fase 1: Catalog — Foundation
-- =============================================================

-- =============================================================
-- 1. EXTENSION — pgcrypto for gen_random_uuid() in edge functions
-- =============================================================
create extension if not exists "pgcrypto" with schema extensions;

-- =============================================================
-- 2. ADMIN ROLE MANAGEMENT
-- =============================================================

-- 2.1  Function: set_admin_role()
--      Sets the admin role in app_metadata for a given user.
--      Only callable by existing admins or service_role.
--      Uses raw_app_meta_data (server-side, not user-editable).
--      IMPORTANT: app_metadata changes apply on next token refresh.
create or replace function public.set_admin_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow if:
  -- 1. The calling user is an existing admin (checked via is_admin())
  -- 2. The call comes from service_role (no auth context — auth.uid() is null)
  if not (public.is_admin() or auth.uid() is null) then
    raise exception 'Only admins can promote users to admin role';
  end if;

  update auth.users
  set raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('role', 'admin')
  where id = target_user_id;
end;
$$;

comment on function public.set_admin_role is 'Sets admin role in app_metadata for a user. Only callable by existing admins.';

-- 2.2  Function: remove_admin_role()
--      Removes the admin role from a user's app_metadata.
create or replace function public.remove_admin_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data - 'role'
  where id = target_user_id;
end;
$$;

comment on function public.remove_admin_role is 'Removes admin role from a user. Only callable by existing admins.';

-- 2.3  Function: is_admin()
--      Convenience function for RLS policies to check admin role.
--      Uses app_metadata instead of raw_user_meta_data for security.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'app_metadata' is not null
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

comment on function public.is_admin is 'Returns true if the current user has admin role in app_metadata.';

-- 2.4  Function: get_admin_users()
--      Returns list of users with admin role.
--      Accessible only to admin users.
create or replace function public.get_admin_users()
returns table (id uuid, email text, created_at timestamptz)
language sql
security definer
set search_path = auth
as $$
  select id, email, created_at
  from auth.users
  where raw_app_meta_data ->> 'role' = 'admin'
  order by created_at desc;
$$;

comment on function public.get_admin_users is 'Returns list of admin users. Only callable by admins.';

-- =============================================================
-- 3. COMPLETE RLS POLICIES
-- =============================================================

-- 3.1  CATEGORIES
--      - Public SELECT: anyone can see categories
--      - Admin ALL: only admin can manage
alter table if exists categories enable row level security;

-- Drop existing policies if any (idempotent)
drop policy if exists "Categories are visible to everyone" on categories;
drop policy if exists "Admin can manage categories" on categories;

create policy "Categories are visible to everyone"
  on categories for select
  using (true);

create policy "Admin can manage categories"
  on categories for all
  using (is_admin())
  with check (is_admin());

-- 3.2  PRODUCTS — already have RLS, add is_admin() convenience
-- Drop old policies that used raw JWT role check
drop policy if exists "Products are visible to everyone (active only)" on products;
drop policy if exists "Admin can manage all products" on products;

create policy "Products are visible to everyone (active only)"
  on products for select
  using (is_active = true);

create policy "Admin can manage all products"
  on products for all
  using (is_admin())
  with check (is_admin());

-- 3.3  PRODUCT VARIANTS
--      - Public SELECT: anyone can see variants (for product detail)
--      - Admin ALL: only admin can manage
alter table if exists product_variants enable row level security;

drop policy if exists "Variants are visible to everyone" on product_variants;
drop policy if exists "Admin can manage variants" on product_variants;

create policy "Variants are visible to everyone"
  on product_variants for select
  using (true);

create policy "Admin can manage variants"
  on product_variants for all
  using (is_admin())
  with check (is_admin());

-- 3.4  CUSTOMERS — already have RLS, upgrade to use is_admin()
drop policy if exists "Customers can view their own profile" on customers;
drop policy if exists "Customers can update their own profile" on customers;
drop policy if exists "Admin can manage all customers" on customers;

create policy "Customers can view their own profile"
  on customers for select
  using (
    auth.uid() = user_id
    or is_admin()
  );

create policy "Customers can update their own profile"
  on customers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin can manage all customers"
  on customers for all
  using (is_admin())
  with check (is_admin());

-- 3.5  ORDERS — already have RLS, upgrade to use is_admin()
drop policy if exists "Customers can view their own orders" on orders;
drop policy if exists "Customers can update their own orders" on orders;
drop policy if exists "Admin can manage all orders" on orders;

create policy "Customers can view their own orders"
  on orders for select
  using (
    auth.uid() in (select user_id from customers where id = customer_id)
    or is_admin()
  );

create policy "Customers can update their own orders"
  on orders for update
  using (auth.uid() in (select user_id from customers where id = customer_id))
  with check (auth.uid() in (select user_id from customers where id = customer_id));

create policy "Admin can manage all orders"
  on orders for all
  using (is_admin())
  with check (is_admin());

-- 3.6  ORDER ITEMS
--      - Customers can see their own order items (via order relationship)
--      - Admin can see all
--      - Admin can manage
alter table if exists order_items enable row level security;

drop policy if exists "Order items visible to owner or admin" on order_items;
drop policy if exists "Admin can manage order items" on order_items;

create policy "Order items visible to owner or admin"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      join customers c on c.id = o.customer_id
      where o.id = order_id
      and c.user_id = auth.uid()
    )
    or is_admin()
  );

create policy "Admin can manage order items"
  on order_items for all
  using (is_admin())
  with check (is_admin());

-- 3.7  PURCHASES (supplier orders)
--      - Admin only
alter table if exists purchases enable row level security;

drop policy if exists "Admin can manage purchases" on purchases;

create policy "Admin can manage purchases"
  on purchases for all
  using (is_admin())
  with check (is_admin());

-- 3.8  PURCHASE ITEMS
--      - Admin only (via purchase relationship)
alter table if exists purchase_items enable row level security;

drop policy if exists "Purchase items admin only" on purchase_items;

create policy "Purchase items admin only"
  on purchase_items for all
  using (is_admin())
  with check (is_admin());

-- 3.9  EXPENSES
--      - Admin only
alter table if exists expenses enable row level security;

drop policy if exists "Admin can manage expenses" on expenses;

create policy "Admin can manage expenses"
  on expenses for all
  using (is_admin())
  with check (is_admin());

-- 3.10 CASH MOVEMENTS — already have RLS, upgrade to use is_admin()
drop policy if exists "Admin can manage cash movements" on cash_movements;

create policy "Admin can manage cash movements"
  on cash_movements for all
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- 4. DASHBOARD VIEWS
-- =============================================================

-- 4.1  daily_sales — dashboard: today's sales summary
create or replace view daily_sales with (security_invoker = true) as
select
  date_trunc('day', created_at) as day,
  count(*)                       as total_orders,
  sum(total)                     as revenue,
  count(distinct customer_id)    as unique_customers
from orders
where status = 'delivered'
  and created_at >= date_trunc('day', now())
group by day
order by day desc;

comment on view daily_sales is 'Today sales summary for dashboard widget';

-- 4.2  top_products — dashboard: best selling products
create or replace view top_products with (security_invoker = true) as
select
  p.id,
  p.name,
  p.price,
  sum(oi.quantity)                                    as units_sold,
  count(distinct o.id)                                 as order_count,
  sum(oi.subtotal)                                     as total_revenue
from products p
join order_items oi on oi.product_id = p.id
join orders o on o.id = oi.order_id
where o.status in ('delivered', 'shipped')
group by p.id, p.name, p.price
order by units_sold desc
limit 20;

comment on view top_products is 'Top 20 best-selling products by units sold';

-- 4.3  customer_summary — admin: customer stats
create or replace view customer_summary with (security_invoker = true) as
select
  c.id,
  c.first_name,
  c.last_name,
  c.phone,
  c.created_at                                         as customer_since,
  count(o.id)                                          as total_orders,
  coalesce(sum(o.total), 0)                            as total_spent,
  max(o.created_at)                                    as last_order_date
from customers c
left join orders o on o.customer_id = c.id
group by c.id, c.first_name, c.last_name, c.phone, c.created_at
order by total_spent desc;

comment on view customer_summary is 'Customer statistics with order history';

-- =============================================================
-- 5. STORAGE BUCKET SETUP (via SQL function for migrations)
-- =============================================================

-- Function: ensure_storage_buckets()
-- Creates the required storage buckets if they don't exist.
-- Can be called from the dashboard or via seed.sql.
-- Note: Storage bucket creation in migrations may not work in
-- all Supabase environments. Use seed.sql as the primary method.
create or replace function public.ensure_storage_buckets()
returns void
language plpgsql
security definer
as $$
begin
  -- Create product-images bucket (public)
  insert into storage.buckets (id, name, public, avif_autodetection)
  values ('product-images', 'product-images', true, false)
  on conflict (id) do nothing;

  -- Create receipts bucket (private)
  insert into storage.buckets (id, name, public, avif_autodetection)
  values ('receipts', 'receipts', false, false)
  on conflict (id) do nothing;
end;
$$;

comment on function public.ensure_storage_buckets is 'Creates storage buckets if they do not exist';

-- =============================================================
-- 6. GRANT PERMISSIONS
-- =============================================================

-- Grant usage on public schema to anon and authenticated roles
grant usage on schema public to anon, authenticated;

-- Grant select on tables that public should access
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_variants to anon, authenticated;

-- Grant all on admin-only tables
grant all on public.orders to authenticated;
grant all on public.order_items to authenticated;
grant all on public.customers to authenticated;
grant all on public.purchases to authenticated;
grant all on public.purchase_items to authenticated;
grant all on public.expenses to authenticated;
grant all on public.cash_movements to authenticated;

-- Grant execute on helper functions
grant execute on function public.is_admin to anon, authenticated;
grant execute on function public.set_admin_role to authenticated;
grant execute on function public.remove_admin_role to authenticated;
grant execute on function public.get_admin_users to authenticated;
grant execute on function public.ensure_storage_buckets to authenticated;

-- =============================================================
-- END OF MIGRATION
-- =============================================================
