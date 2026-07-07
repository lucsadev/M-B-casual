-- =============================================================
-- M&B Trend — Initial Database Schema
-- Migration: 00001_initial.sql
-- Description: Extensions, enums, 10 tables, indexes, triggers,
--              views, auth trigger, and RLS policies
-- Fase 0: Foundation
-- =============================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- =============================================================
-- 2. ENUMS
-- =============================================================
create type order_status as enum (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- =============================================================
-- 3. TABLES
-- Order: categories → products → product_variants → customers
--        → orders → order_items → purchases → purchase_items
--        → expenses → cash_movements
-- =============================================================

-- 3.1  CATEGORIES
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

comment on table categories is 'Product categories (Mujer, Hombre, Accesorios)';

-- 3.2  PRODUCTS
create table products (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid not null references categories(id),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null,
  compare_price numeric(10,2),
  images        text[],
  tags          text[],
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table products is 'Product catalog — all items with pricing and metadata';
comment on column products.compare_price is 'Original/crossed-out price for discount display';

-- 3.3  PRODUCT VARIANTS (size + color per product)
create table product_variants (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  size       text,
  color      text,
  color_hex  text,
  stock      int not null default 0,
  sku        text unique,
  created_at timestamptz not null default now()
);

comment on table product_variants is 'Size, color, and stock tracking per product';
comment on column product_variants.color_hex is 'Hex color code for swatch display (e.g. #000000)';
comment on column product_variants.sku is 'Internal stock-keeping unit code';

-- 3.4  CUSTOMERS (extends auth.users)
-- NOTE: user_id references auth.users(id) at runtime.
-- The FK constraint is intentionally omitted here because
-- auth.users is managed by Supabase and its DDL is not available
-- during local migration execution. The relationship is enforced
-- at the application layer and via the handle_new_user() trigger.
create table customers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique,  -- references auth.users(id) on delete cascade
  first_name  text not null default '',
  last_name   text not null default '',
  phone       text,
  address     jsonb,
  created_at  timestamptz not null default now()
);

comment on table customers is 'Extended customer profile data linked to auth.users';
comment on column customers.user_id is 'FK to auth.users(id) — constraint enforced via trigger, not DDL';

-- 3.5  ORDERS
create table orders (
  id               uuid primary key default uuid_generate_v4(),
  customer_id      uuid not null references customers(id),
  status           order_status not null default 'pending',
  total            numeric(10,2) not null,
  shipping_cost    numeric(10,2) not null default 0,
  discount         numeric(10,2) not null default 0,
  payment_method   text,
  payment_status   text not null default 'pending',
  notes            text,
  shipping_address jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table orders is 'Customer orders with lifecycle tracking';
comment on column orders.payment_method is 'Payment method: transferencia, efectivo, mp';
comment on column orders.payment_status is 'pending | paid | refunded';

-- 3.6  ORDER ITEMS
create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  quantity    int not null check (quantity > 0),
  unit_price  numeric(10,2) not null,
  subtotal    numeric(10,2) not null
);

comment on table order_items is 'Line items within an order — snapshot of price at purchase time';

-- 3.7  PURCHASES (supplier orders)
create table purchases (
  id              uuid primary key default uuid_generate_v4(),
  supplier_name   text not null,
  invoice_number  text,
  total           numeric(10,2) not null,
  notes           text,
  purchase_date   date not null default current_date,
  created_at      timestamptz not null default now()
);

comment on table purchases is 'Supplier purchase records for inventory accounting';

-- 3.8  PURCHASE ITEMS
create table purchase_items (
  id          uuid primary key default uuid_generate_v4(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  quantity    int not null check (quantity > 0),
  unit_cost   numeric(10,2) not null,
  subtotal    numeric(10,2) not null
);

comment on table purchase_items is 'Line items within a supplier purchase';

-- 3.9  EXPENSES (operational costs)
create table expenses (
  id           uuid primary key default uuid_generate_v4(),
  description  text not null,
  amount       numeric(10,2) not null,
  category     text not null,
  expense_date date not null default current_date,
  receipt_url  text,
  created_by   uuid,  -- references auth.users(id) at runtime
  created_at   timestamptz not null default now()
);

comment on table expenses is 'Operational expenses with receipt attachments';
comment on column expenses.category is 'Expense category: publicidad, packaging, envío, etc.';
comment on column expenses.created_by is 'FK to auth.users(id) — set at application layer';

-- 3.10  CASH MOVEMENTS (financial register)
create table cash_movements (
  id             uuid primary key default uuid_generate_v4(),
  type           text not null check (type in ('income', 'expense')),
  amount         numeric(10,2) not null,
  description    text not null,
  reference_type text,
  reference_id   uuid,
  movement_date  date not null default current_date,
  created_by     uuid,  -- references auth.users(id) at runtime
  created_at     timestamptz not null default now()
);

comment on table cash_movements is 'Financial register for cash flow tracking';
comment on column cash_movements.reference_type is 'Related entity type: order, expense, purchase, transfer';
comment on column cash_movements.reference_id is 'UUID of the related entity';
comment on column cash_movements.created_by is 'FK to auth.users(id) — set at application layer';

-- =============================================================
-- 4. INDEXES
-- Performance indexes for common query patterns
-- =============================================================

-- Products: full-text search and unique slug
create index idx_products_name on products using gin (to_tsvector('spanish', name));
create index idx_products_category on products (category_id);
create index idx_products_active on products (is_active) where is_active = true;

-- Orders: customer lookups
create index idx_orders_customer on orders (customer_id);
create index idx_orders_status on orders (status);
create index idx_orders_created on orders (created_at desc);

-- Order items: product lookups
create index idx_order_items_product on order_items (product_id);
create index idx_order_items_order on order_items (order_id);

-- Product variants: product lookups
create index idx_variants_product on product_variants (product_id);

-- Customers: user lookups
create index idx_customers_user on customers (user_id);

-- Purchases: supplier and date lookups
create index idx_purchases_date on purchases (purchase_date desc);
create index idx_purchases_supplier on purchases (supplier_name);

-- Expenses: date and category lookups
create index idx_expenses_date on expenses (expense_date desc);
create index idx_expenses_category on expenses (category);

-- Cash movements: date range and type queries
create index idx_cash_movements_date on cash_movements (movement_date desc);
create index idx_cash_movements_type on cash_movements (type);

-- =============================================================
-- 5. TRIGGERS — Automatic updated_at
-- =============================================================

-- Function: set_updated_at()
-- Sets the updated_at column to now() on row modification
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Products: auto-update timestamp
create trigger trg_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- Orders: auto-update timestamp
create trigger trg_orders_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

-- =============================================================
-- 6. VIEWS
-- =============================================================

-- 6.1  monthly_sales — dashboard: revenue aggregation by month
create view monthly_sales with (security_invoker = true) as
select
  date_trunc('month', created_at) as month,
  count(*)                         as total_orders,
  sum(total)                       as revenue,
  avg(total)                       as avg_ticket
from orders
where status = 'delivered'
group by month
order by month desc;

comment on view monthly_sales is 'Monthly revenue and order statistics for dashboard';

-- 6.2  low_stock — inventory: variants with critically low stock
create view low_stock with (security_invoker = true) as
select
  p.name       as product_name,
  pv.size,
  pv.color,
  pv.stock
from product_variants pv
join products p on p.id = pv.product_id
where pv.stock < 5
  and p.is_active = true
order by pv.stock asc;

comment on view low_stock is 'Active products with stock below 5 units';

-- =============================================================
-- 7. AUTH TRIGGER — Auto-create customer on signup
-- =============================================================

-- Function: handle_new_user()
-- Creates a customer profile row when a new user signs up via auth.
-- Runs as security definer so it can write to the public schema.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into customers (user_id, first_name, last_name)
  values (new.id, '', '');
  return new;
end;
$$ language plpgsql security definer;

comment on function handle_new_user() is 'Trigger function: auto-creates customer profile on user signup';

-- Trigger: on_auth_user_created
-- Fires after INSERT on auth.users to ensure every auth user
-- has a corresponding customer profile.
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

comment on trigger on_auth_user_created on auth.users is
  'Auto-creates customer row when a new auth user registers';

-- =============================================================
-- 8. ROW-LEVEL SECURITY (RLS)
-- =============================================================

-- 8.1  PRODUCTS
--     - Public SELECT: only active products visible to anyone
--     - Admin ALL: authenticated users with admin role
alter table products enable row level security;

create policy "Products are visible to everyone (active only)"
  on products for select
  using (is_active = true);

create policy "Admin can manage all products"
  on products for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- 8.2  ORDERS
--     - Owner SELECT/UPDATE: customer sees their own orders
--     - Admin ALL: full access
alter table orders enable row level security;

create policy "Customers can view their own orders"
  on orders for select
  using (
    auth.uid() = customer_id
    or auth.jwt() ->> 'role' = 'admin'
  );

create policy "Customers can update their own orders"
  on orders for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create policy "Admin can manage all orders"
  on orders for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- 8.3  CASH MOVEMENTS — admin only
alter table cash_movements enable row level security;

create policy "Admin can manage cash movements"
  on cash_movements for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- 8.4  CUSTOMERS
--     - Owner SELECT/UPDATE: user sees/edits own profile
--     - Admin ALL: full access
alter table customers enable row level security;

create policy "Customers can view their own profile"
  on customers for select
  using (
    auth.uid() = user_id
    or auth.jwt() ->> 'role' = 'admin'
  );

create policy "Customers can update their own profile"
  on customers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin can manage all customers"
  on customers for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- =============================================================
-- END OF MIGRATION
-- =============================================================
