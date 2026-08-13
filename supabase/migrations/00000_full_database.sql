-- =============================================================================
-- M&B Trend — FULL DATABASE (Consolidated)
-- =============================================================================
-- Single-file migration with the FINAL state of the whole database:
-- extensions, enums, tables, indexes, functions, triggers, views, RLS,
-- grants, realtime publications, storage buckets, and user bootstrap notes.
--
-- ⚠️  FRESH ENVIRONMENT ONLY.
-- This file recreates everything from scratch. Do NOT apply it on top of a
-- database that already has the incremental migrations (00001…00017) applied —
-- it will fail on duplicate objects.
--
-- Derived from migrations:
--   00001_initial.sql, 00002_catalog_indexes.sql, 00003_complete_rls_and_admin.sql,
--   00004_cart_checkout.sql, 00005_finance_extras.sql, 00006_finance_triggers.sql,
--   00007_order_stock.sql, 00008_order_stock_status.sql, 00009_customers_full_name.sql,
--   00010_orders_customer_name.sql, 00011_variant_discount.sql, 00012_discounted_products_view.sql,
--   00013_drop_compare_price.sql, 00014_product_questions.sql, 00015_fix_product_questions_rls.sql,
--   00016_loosen_question_text_check.sql, 00017_messages.sql,
--   20260709220149_harden_admin_security.sql, 20260710155334_populate_google_customer_names.sql,
--   20260710155842_populate_google_customer_contact.sql, 20260719003521_enable_order_realtime_notifications.sql,
--   00002_sku_autofill_trigger.sql
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists pg_trgm with schema extensions;

comment on extension pg_trgm is 'Trigram text search for ILIKE queries on product names';

-- =============================================================================
-- 2. ENUMS
-- =============================================================================
create type order_status as enum (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1  CATEGORIES
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3.2  PRODUCTS
-- compare_price was dropped (00013): the compare/crossed-out price is now
-- derived from variant discounts via the discounted_products view.
-- pack_units (00007): NULL = not a pack; 2|3 = x2/x3 pack size. When
-- non-NULL, products.price is the TOTAL pack price covering N variant units.
-- ---------------------------------------------------------------------------
create table products (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid not null references categories(id),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null,
  pack_units    smallint,
  images        text[],
  tags          text[],
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint products_pack_units_check check (pack_units is null or pack_units >= 2)
);

comment on table products is 'Product catalog — all items with pricing and metadata';
comment on column products.pack_units is
  'Pack size (x2/x3): number of variants the buyer must pick for the single pack price. NULL = not a pack.';

-- ---------------------------------------------------------------------------
-- 3.3  PRODUCT VARIANTS (size + color per product, with discount %)
-- ---------------------------------------------------------------------------
create table product_variants (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  size       text,
  color      text,
  color_hex  text,
  stock      int not null default 0,
  sku        text unique,
  created_at timestamptz not null default now(),
  discount   int not null default 0
);

comment on table product_variants is 'Size, color, and stock tracking per product';
comment on column product_variants.color_hex is 'Hex color code for swatch display (e.g. #000000)';
comment on column product_variants.sku is 'Internal stock-keeping unit code';
comment on column product_variants.discount is 'Discount percentage (0-100) applied on top of the base product.price. E.g. 30 = 30% off.';

-- ---------------------------------------------------------------------------
-- 3.4  CUSTOMERS (extends auth.users)
-- NOTE: user_id references auth.users(id) at runtime. The FK constraint is
-- intentionally omitted because auth.users is managed by Supabase. The
-- relationship is enforced via the handle_new_user() trigger.
-- ---------------------------------------------------------------------------
create table customers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique,  -- references auth.users(id) on delete cascade
  first_name  text not null default '',
  last_name   text not null default '',
  phone       text,
  address     jsonb,
  created_at  timestamptz not null default now(),
  full_name   text generated always as (
                trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
              ) stored
);

comment on table customers is 'Extended customer profile data linked to auth.users';
comment on column customers.user_id is 'FK to auth.users(id) — constraint enforced via trigger, not DDL';
comment on column customers.full_name is 'Stored first_name + last_name for name search (e.g. "Lucía Gómez")';

-- ---------------------------------------------------------------------------
-- 3.5  ORDERS (with denormalized customer_name)
-- ---------------------------------------------------------------------------
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
  updated_at       timestamptz not null default now(),
  customer_name    text,
  whatsapp_pending_notification_status text not null default 'not_sent',
  whatsapp_pending_notification_attempted_at timestamptz,
  whatsapp_pending_notified_at timestamptz,
  whatsapp_pending_notification_error text
);

comment on table orders is 'Customer orders with lifecycle tracking';
comment on column orders.payment_method is 'Payment method: transferencia, efectivo, mp';
comment on column orders.payment_status is 'pending | paid | refunded | cancelled';
comment on column orders.customer_name is 'Denormalized customer full name for search';

-- ---------------------------------------------------------------------------
-- 3.6  ORDER ITEMS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3.7  PURCHASES (supplier orders)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3.8  PURCHASE ITEMS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3.9  EXPENSES (operational costs)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3.10  CASH MOVEMENTS (financial register)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3.11  CART ITEMS
-- ---------------------------------------------------------------------------
create table cart_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null,  -- references auth.users(id) at runtime
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  quantity    int not null check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table cart_items is 'Shopping cart items per user (anonymous or authenticated)';
comment on column cart_items.user_id is 'FK to auth.users(id) — enforced at application layer';
comment on column cart_items.variant_id is 'Nullable: null means no variant selected';

-- ---------------------------------------------------------------------------
-- 3.12  PRODUCT QUESTIONS (Q&A)
-- ---------------------------------------------------------------------------
create table product_questions (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  customer_name text,
  question_text text not null check (char_length(question_text) >= 1),
  answer_text   text,
  answered_by   uuid references auth.users(id) on delete set null,
  answered_at   timestamptz,
  is_visible    boolean not null default true,
  session_id    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_customer_name_required
    check (customer_id is not null or (customer_name is not null and customer_name <> ''))
);

comment on table product_questions is 'Public Q&A per product — customers ask, admins answer';
comment on column product_questions.customer_name is 'Display name for anonymous questions; required when customer_id is null';
comment on column product_questions.session_id is 'Anonymous session identifier for rate limiting';
comment on column product_questions.is_visible is 'Admin toggle to hide inappropriate questions';

-- ---------------------------------------------------------------------------
-- 3.13  MESSAGES (seller → customer notifications)
-- ---------------------------------------------------------------------------
create table messages (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  type        text not null default 'general' check (type in ('general', 'order_status', 'payment_status')),
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table messages is 'Notifications from seller/admin to customers about orders and general updates';
comment on column messages.type is 'Message category: general, order_status, payment_status';
comment on column messages.title is 'Short summary (e.g. "Pedido actualizado a Enviado")';
comment on column messages.body is 'Optional detailed message';

-- ---------------------------------------------------------------------------
-- 3.14  NOTIFICATION LOGS (external notification audit trail)
-- ---------------------------------------------------------------------------
create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  channel text not null,
  event text not null,
  recipient text,
  status text not null,
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

comment on table notification_logs is 'Audit log for external notifications such as admin WhatsApp order alerts';

-- =============================================================================
-- 4. INDEXES
-- NOTE: the original 00002 used CREATE INDEX CONCURRENTLY, which cannot run
-- inside the transaction Supabase wraps around migrations — removed here.
-- =============================================================================

-- Products: full-text search and unique slug
create index idx_products_name on products using gin (to_tsvector('spanish', name));
create index idx_products_category on products (category_id);
create index idx_products_active on products (is_active) where is_active = true;

-- Products: trigram ILIKE search + catalog query composites
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index idx_products_catalog_query on products (category_id, is_active, created_at desc);
create index idx_products_active_only on products (created_at desc) where is_active = true;

-- Product variants: product lookups + covering index for stock queries
create index idx_variants_product on product_variants (product_id);
create index idx_variants_lookup on product_variants (product_id) include (size, color, stock, sku);

-- Orders: customer lookups, status, created, realtime
create index idx_orders_customer on orders (customer_id);
create index idx_orders_status on orders (status);
create index idx_orders_created on orders (created_at desc);

-- Order items: product lookups
create index idx_order_items_product on order_items (product_id);
create index idx_order_items_order on order_items (order_id);

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

-- Cart items
create index idx_cart_items_user on cart_items (user_id);
create index idx_cart_items_product on cart_items (product_id);
create index idx_cart_items_user_product_variant on cart_items (user_id, product_id, variant_id);

-- Product questions
create index idx_pq_product_created on product_questions (product_id, created_at desc);
create index idx_pq_session_rate on product_questions (session_id, created_at);
create index idx_pq_customer_rate on product_questions (customer_id, created_at);

-- Messages
create index idx_messages_customer on messages (customer_id, created_at desc);
create index idx_messages_unread on messages (customer_id, is_read) where is_read = false;

-- =============================================================================
-- 5. FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1  set_updated_at() — auto-updates updated_at on row modification
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 5.2  handle_new_user() — auto-creates customer profile on signup
--      Hydrates first/last name, phone, and address from OAuth metadata
--      (Google) or app-provided "nombre"/"apellido"/"telefono" metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text := trim(coalesce(
    metadata->>'nombre',
    metadata->>'full_name',
    metadata->>'name',
    ''
  ));
  derived_first_name text := '';
  derived_last_name text := '';
  derived_phone text := coalesce(
    nullif(metadata->>'telefono', ''),
    nullif(metadata->>'phone', ''),
    nullif(metadata->>'phone_number', ''),
    nullif(metadata->>'phoneNumber', ''),
    nullif(metadata#>>'{phone_numbers,0,value}', ''),
    nullif(metadata#>>'{phoneNumbers,0,value}', ''),
    nullif(metadata#>>'{phone_numbers,0,canonicalForm}', ''),
    nullif(metadata#>>'{phoneNumbers,0,canonicalForm}', '')
  );
  derived_address jsonb := coalesce(
    metadata->'address',
    metadata->'domicilio',
    metadata->'location',
    metadata#>'{addresses,0}'
  );
begin
  if display_name <> '' then
    derived_first_name := split_part(display_name, ' ', 1);
    derived_last_name := nullif(trim(substr(display_name, length(derived_first_name) + 1)), '');
  end if;

  insert into public.customers (user_id, first_name, last_name, phone, address)
  values (
    new.id,
    coalesce(nullif(metadata->>'nombre', ''), derived_first_name, ''),
    coalesce(nullif(metadata->>'apellido', ''), derived_last_name, ''),
    derived_phone,
    derived_address
  );

  return new;
end;
$$;

comment on function handle_new_user() is 'Trigger function: auto-creates customer profile on user signup, hydrating OAuth contact data';

-- ---------------------------------------------------------------------------
-- 5.3  is_admin() — RLS helper: checks admin role in app_metadata
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5.4  set_admin_role(uuid) — promotes a user to admin
-- ---------------------------------------------------------------------------
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
    coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
  where id = target_user_id;
end;
$$;

comment on function public.set_admin_role is 'Sets admin role in app_metadata for a user. Only callable by existing admins.';

-- ---------------------------------------------------------------------------
-- 5.5  remove_admin_role(uuid) — removes admin role (hardened: admin-only)
-- ---------------------------------------------------------------------------
create or replace function public.remove_admin_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove admin role';
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
  where id = target_user_id;
end;
$$;

comment on function public.remove_admin_role is 'Removes admin role from a user. Only callable by admins.';

-- ---------------------------------------------------------------------------
-- 5.6  get_admin_users() — lists admin users (hardened: admin-only)
-- ---------------------------------------------------------------------------
create or replace function public.get_admin_users()
returns table (id uuid, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can list admin users';
  end if;

  return query
  select u.id, u.email::text, u.created_at
  from auth.users u
  where u.raw_app_meta_data ->> 'role' = 'admin'
  order by u.created_at desc;
end;
$$;

comment on function public.get_admin_users is 'Returns list of admin users. Only callable by admins.';

-- ---------------------------------------------------------------------------
-- 5.7  create_order_from_cart(jsonb, text) — atomic checkout RPC
--      Considers variant-level discount when computing unit_price and total.
-- ---------------------------------------------------------------------------
create or replace function public.create_order_from_cart(
  p_shipping_address jsonb,
  p_payment_method text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid;
  v_customer_id  uuid;
  v_order_id     uuid;
  v_total        numeric(10,2);
  v_shipping_cost numeric(10,2) := 0;
  v_cart_count   int;
begin
  -- 1. Authenticate
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  -- 2. Resolve customer_id
  select id into v_customer_id
  from customers
  where user_id = v_user_id;

  if v_customer_id is null then
    raise exception 'Perfil de cliente no encontrado';
  end if;

  -- 3. Verify cart has items
  select count(*) into v_cart_count
  from cart_items
  where user_id = v_user_id;

  if v_cart_count = 0 then
    raise exception 'El carrito está vacío';
  end if;

  -- 4. Calculate total with variant discount
  select coalesce(sum(
    round(
      (p.price * (1 - coalesce(pv.discount, 0)::numeric / 100)) * ci.quantity
    , 2)
  ), 0)
  into v_total
  from cart_items ci
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where ci.user_id = v_user_id;

  -- 5. Insert order
  insert into orders (
    customer_id, status, total, shipping_cost, discount,
    payment_method, payment_status, shipping_address,
    notes, created_at, updated_at
  ) values (
    v_customer_id,
    'pending',
    v_total + v_shipping_cost,
    v_shipping_cost,
    0,
    p_payment_method,
    'pending',
    p_shipping_address,
    null,
    now(),
    now()
  )
  returning id into v_order_id;

  -- 6. Insert order_items with variant-discounted unit_price
  insert into order_items (
    order_id, product_id, variant_id, quantity, unit_price, subtotal
  )
  select
    v_order_id,
    ci.product_id,
    ci.variant_id,
    ci.quantity,
    round(p.price * (1 - coalesce(pv.discount, 0)::numeric / 100), 2),
    round((p.price * (1 - coalesce(pv.discount, 0)::numeric / 100)) * ci.quantity, 2)
  from cart_items ci
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where ci.user_id = v_user_id;

  -- 7. Clear cart
  delete from cart_items
  where user_id = v_user_id;

  -- 8. Return the new order id
  return v_order_id;
end;
$$;

comment on function public.create_order_from_cart is
  'Creates an order from the current user''s cart items. Considers variant-level discount when calculating unit_price. Returns the new order UUID.';

-- ---------------------------------------------------------------------------
-- 5.8  update_stock_from_purchase(uuid) — stock increment helper (manual RPC)
--      Internal helper: not exposed to anon/authenticated (see GRANTS).
-- ---------------------------------------------------------------------------
create or replace function update_stock_from_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update product_variants pv
  set stock = pv.stock + pi.quantity
  from purchase_items pi
  where pi.purchase_id = p_purchase_id
    and pi.variant_id = pv.id
    and pi.variant_id is not null;
end;
$$;

comment on function update_stock_from_purchase is
  'Atomically increments product_variants.stock by purchased quantities';

-- ---------------------------------------------------------------------------
-- 5.9  auto_create_cash_movement(...) — internal cash flow helper
--      Internal helper: not exposed to anon/authenticated (see GRANTS).
-- ---------------------------------------------------------------------------
create or replace function auto_create_cash_movement(
  p_type           text,
  p_amount         numeric,
  p_description    text,
  p_reference_type text,
  p_reference_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into cash_movements (
    type,
    amount,
    description,
    reference_type,
    reference_id,
    movement_date,
    created_by
  ) values (
    p_type,
    p_amount,
    p_description,
    p_reference_type,
    p_reference_id,
    current_date,
    auth.uid()
  );
end;
$$;

comment on function auto_create_cash_movement is
  'Inserts a cash_movement row — called by triggers on expenses, purchases, and orders';

-- ---------------------------------------------------------------------------
-- 5.10  handle_order_delivered_cash_movement() — income on order 'delivered'
-- ---------------------------------------------------------------------------
create or replace function handle_order_delivered_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act when status changes to 'delivered'
  if new.status = 'delivered' and (old.status is distinct from 'delivered' or old.status is null) then
    perform auto_create_cash_movement(
      'income',
      new.total,
      'Venta #' || substring(new.id::text, 1, 8),
      'order',
      new.id
    );
  end if;

  return new;
end;
$$;

comment on function handle_order_delivered_cash_movement is
  'Auto-creates cash_movement (income) when order status changes to delivered';

-- ---------------------------------------------------------------------------
-- 5.11  handle_expense_cash_movement() — expense cash movement
-- ---------------------------------------------------------------------------
create or replace function handle_expense_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform auto_create_cash_movement(
    'expense',
    new.amount,
    'Gasto: ' || new.description,
    'expense',
    new.id
  );
  return new;
end;
$$;

comment on function handle_expense_cash_movement is
  'Auto-creates cash_movement (expense) when a new expense is recorded';

-- ---------------------------------------------------------------------------
-- 5.12  handle_purchase_cash_movement() — purchase cash movement
-- ---------------------------------------------------------------------------
create or replace function handle_purchase_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform auto_create_cash_movement(
    'expense',
    new.total,
    'Compra a proveedor: ' || new.supplier_name,
    'purchase',
    new.id
  );
  return new;
end;
$$;

comment on function handle_purchase_cash_movement is
  'Auto-creates cash_movement (expense) when a purchase is registered';

-- ---------------------------------------------------------------------------
-- 5.13  handle_purchase_item_stock_update() — stock per purchase item insert
-- ---------------------------------------------------------------------------
create or replace function handle_purchase_item_stock_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only update stock if variant_id is specified
  if new.variant_id is not null then
    update product_variants
    set stock = stock + new.quantity
    where id = new.variant_id;
  end if;

  return new;
end;
$$;

comment on function handle_purchase_item_stock_update is
  'Atomically increments variant stock when a purchase item is created';

-- ---------------------------------------------------------------------------
-- 5.14  handle_order_item_stock_decrement() — stock on sale
-- ---------------------------------------------------------------------------
create or replace function handle_order_item_stock_decrement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.variant_id is not null then
    update product_variants
    set stock = greatest(stock - NEW.quantity, 0)
    where id = NEW.variant_id;
  end if;
  return NEW;
end;
$$;

comment on function handle_order_item_stock_decrement is
  'Decrements product_variants.stock when an order item is created (covers checkout and admin-created orders)';

-- ---------------------------------------------------------------------------
-- 5.15  handle_order_status_stock_adjust() — stock on cancel / reactivation
-- ---------------------------------------------------------------------------
create or replace function handle_order_status_stock_adjust()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status is distinct from NEW.status then
    if NEW.status = 'cancelled' then
      update product_variants pv
      set stock = pv.stock + oi.quantity
      from order_items oi
      where oi.order_id = NEW.id
        and oi.variant_id is not null
        and pv.id = oi.variant_id;
    elsif OLD.status = 'cancelled' then
      update product_variants pv
      set stock = greatest(pv.stock - oi.quantity, 0)
      from order_items oi
      where oi.order_id = NEW.id
        and oi.variant_id is not null
        and pv.id = oi.variant_id;
    end if;
  end if;
  return NEW;
end;
$$;

comment on function handle_order_status_stock_adjust is
  'Returns variant stock when an order is cancelled and re-decrements when it leaves cancelled';

-- ---------------------------------------------------------------------------
-- 5.16  set_order_customer_name() — denormalize customer name on order insert
-- ---------------------------------------------------------------------------
create or replace function set_order_customer_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
  into NEW.customer_name
  from customers
  where id = NEW.customer_id;
  return NEW;
end;
$$;

comment on function set_order_customer_name is 'Looks up customer_name on order insert';

-- ---------------------------------------------------------------------------
-- 5.17  sync_order_customer_name() — keep orders.customer_name in sync
-- ---------------------------------------------------------------------------
create or replace function sync_order_customer_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set customer_name = trim(coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, ''))
  where customer_id = NEW.id;
  return NEW;
end;
$$;

comment on function sync_order_customer_name is 'Keeps orders.customer_name in sync when a customer renames';

-- ---------------------------------------------------------------------------
-- 5.18 variant_sku_base(product_id, size, color) — deterministic SKU base
--      {CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3?}, mirrors generateSku() in
--      packages/shared/src/utils/sku.ts. Reconciled from
--      00002_sku_autofill_trigger.sql for fresh environments.
-- ---------------------------------------------------------------------------
create or replace function public.variant_sku_base(p_product_id uuid, p_size text, p_color text)
returns text
language plpgsql
as $$
declare
  v_cat       text;
  v_prod      text;
  v_size      text;
  v_color_seg text := '';   -- '-XXX' or ''
begin
  -- category/product slugs are pre-sanitized via generateSlug at creation, so
  -- lower() is idempotent and matches the util's generateSlug(slug) call.
  select lower(c.slug), lower(p.slug)
    into v_cat, v_prod
  from products p
  join categories c on c.id = p.category_id
  where p.id = p_product_id;

  -- SIZE: UNI for NULL/empty or "Único"/"Única" (diacritic-insensitive); else
  -- slugify + UPPER, diacritics PRESERVED ([[:alnum:]] is Unicode-aware here).
  if p_size is null or trim(p_size) = '' then
    v_size := 'UNI';
  elsif lower(trim(p_size)) in ('único', 'única', 'unico', 'unica') then
    v_size := 'UNI';
  else
    v_size := upper(btrim(regexp_replace(lower(trim(p_size)), '[^[:alnum:]]+', '-', 'g'), '-'));
  end if;

  -- COLOR3: 3-char slugify + UPPER, diacritics PRESERVED; omitted when absent
  -- (per spec — not the design draft's "GEN" fallback).
  if p_color is not null and trim(p_color) <> '' then
    v_color_seg := '-' || upper(left(btrim(regexp_replace(lower(trim(p_color)), '[^[:alnum:]]+', '-', 'g'), '-'), 3));
  end if;

  return v_cat || '-' || v_prod || '-' || v_size || v_color_seg;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5.19 gen_variant_sku(product_id, size, color) — full SKU builder.
--     Ordinal = per-product sequence (existing count + 1), bumped on collision
--     up to 100 attempts (RAISE), mirroring generateSku's MAX_RETRY_ATTEMPTS.
-- ---------------------------------------------------------------------------
create or replace function public.gen_variant_sku(p_product_id uuid, p_size text, p_color text)
returns text
language plpgsql
as $$
declare
  v_base     text;
  v_ordinal  int;
  v_sku      text;
  v_attempts int := 0;
begin
  v_base := public.variant_sku_base(p_product_id, p_size, p_color);

  -- next 1-based position within this product's variants (NEW row not counted).
  select count(*) + 1 into v_ordinal
  from product_variants
  where product_id = p_product_id;

  v_sku := v_base || '-' || lpad(v_ordinal::text, 3, '0');

  -- collision resolution against existing SKUs (max 100 attempts).
  while exists (select 1 from product_variants where sku = v_sku) loop
    v_attempts := v_attempts + 1;
    if v_attempts > 100 then
      raise exception 'SKU generation exceeded max retry attempts (100) for product %', p_product_id;
    end if;
    v_ordinal := v_ordinal + 1;
    v_sku := v_base || '-' || lpad(v_ordinal::text, 3, '0');
  end loop;

  return v_sku;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5.20 trg_variant_sku_autofill() — trigger wrapper that fills NEW.sku via
--      gen_variant_sku() when it is NULL.
-- ---------------------------------------------------------------------------
create or replace function public.trg_variant_sku_autofill()
returns trigger
language plpgsql
as $$
begin
  if NEW.sku is null then
    NEW.sku := public.gen_variant_sku(NEW.product_id, NEW.size, NEW.color);
  end if;
  return NEW;
end;
$$;

-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- 6.1  Auto updated_at
create trigger trg_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

create trigger trg_orders_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

create trigger trg_cart_items_updated_at
  before update on cart_items
  for each row
  execute function set_updated_at();

create trigger trg_product_questions_updated_at
  before update on product_questions
  for each row
  execute function set_updated_at();

-- 6.2  Auth: auto-create customer profile on signup
-- NOTE: no COMMENT ON TRIGGER here — Supabase restricts comments on auth.*
-- triggers (SQLSTATE 42501: must be owner of relation users)
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- 6.3  Finance: order delivered → cash movement (income)
create trigger trg_order_delivered_cash_movement
  after update of status on orders
  for each row
  when (new.status = 'delivered')
  execute function handle_order_delivered_cash_movement();

-- 6.4  Finance: expense insert → cash movement (expense)
create trigger trg_expense_cash_movement
  after insert on expenses
  for each row
  execute function handle_expense_cash_movement();

-- 6.5  Finance: purchase insert → cash movement (expense)
create trigger trg_purchase_cash_movement
  after insert on purchases
  for each row
  execute function handle_purchase_cash_movement();

-- 6.6  Inventory: purchase item insert → stock increment
create trigger trg_purchase_item_stock_update
  after insert on purchase_items
  for each row
  execute function handle_purchase_item_stock_update();

-- 6.7  Inventory: order item insert → stock decrement (sale)
create trigger trg_order_item_stock_decrement
  after insert on order_items
  for each row
  execute function handle_order_item_stock_decrement();

-- 6.8  Inventory: order cancelled / reactivated → stock adjust
create trigger trg_order_status_stock_adjust
  after update on orders
  for each row
  execute function handle_order_status_stock_adjust();

-- 6.9  Orders: denormalize customer_name on insert
create trigger trg_set_order_customer_name
  before insert on orders
  for each row
  execute function set_order_customer_name();

-- 6.10  Customers: keep orders.customer_name in sync on rename
create trigger trg_sync_order_customer_name
  after update of first_name, last_name on customers
  for each row
  execute function sync_order_customer_name();

-- ---------------------------------------------------------------------------
-- 6.11 Auto-fill NULL variant SKU on insert/update (reconciled from 00002).
--      WHEN (NEW.sku IS NULL) preserves existing SKUs on edits (spec scenario 4).
-- ---------------------------------------------------------------------------
create trigger trg_variant_sku_autofill
  before insert or update on product_variants
  for each row
  when (NEW.sku is null)
  execute function public.trg_variant_sku_autofill();

-- =============================================================================
-- 7. VIEWS
-- =============================================================================

-- 7.1  monthly_sales — dashboard: revenue aggregation by month
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

-- 7.2  low_stock — inventory: variants with critically low stock
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

-- 7.3  daily_sales — dashboard: revenue aggregation by day
create or replace view daily_sales with (security_invoker = true) as
select
  created_at::date                     as day,
  count(*)                             as total_orders,
  sum(total)                           as revenue,
  count(distinct customer_id)          as unique_customers
from orders
where status = 'delivered'
  and created_at >= date_trunc('day', now())
group by created_at::date
order by day desc;

comment on view daily_sales is 'Daily revenue aggregation for dashboard metrics';

-- 7.4  top_products — dashboard: best-selling products
create or replace view top_products with (security_invoker = true) as
select
  p.id,
  p.name,
  p.price,
  sum(oi.quantity)                 as units_sold,
  count(distinct o.id)             as order_count,
  sum(oi.subtotal)                 as total_revenue
from products p
join order_items oi on oi.product_id = p.id
join orders o on o.id = oi.order_id
where o.status = any (array['delivered'::order_status, 'shipped'::order_status])
group by p.id, p.name, p.price
order by sum(oi.quantity) desc
limit 20;

comment on view top_products is 'Top-selling products ranked by revenue';

-- 7.5  product_profitability — margin analysis per product
create or replace view product_profitability with (security_invoker = true) as
select
  p.id,
  p.name,
  p.price,
  coalesce(sum(oi.quantity), 0)                              as units_sold,
  coalesce(sum(oi.subtotal), 0)                              as total_revenue,
  coalesce(sum(pi.unit_cost * oi.quantity), 0)               as estimated_cogs,
  case
    when coalesce(sum(oi.subtotal), 0) > 0
    then round(
      ((coalesce(sum(oi.subtotal), 0) - coalesce(sum(pi.unit_cost * oi.quantity), 0))
       / coalesce(sum(oi.subtotal), 0)) * 100,
      1
    )
    else 0
  end                                                         as margin_percent,
  coalesce(sum(oi.subtotal), 0) - coalesce(sum(pi.unit_cost * oi.quantity), 0)
                                                              as gross_profit
from products p
left join order_items oi on oi.product_id = p.id
left join orders o on o.id = oi.order_id and o.status = 'delivered'
left join purchase_items pi on pi.product_id = p.id
group by p.id, p.name, p.price
order by gross_profit desc;

comment on view product_profitability is 'Estimated gross margin and profit per product';

-- 7.6  customer_summary — customer lifetime value stats
create or replace view customer_summary with (security_invoker = true) as
select
  c.id,
  c.first_name,
  c.last_name,
  c.phone,
  c.created_at                          as customer_since,
  count(distinct o.id)                  as total_orders,
  coalesce(sum(o.total), 0)             as total_spent,
  max(o.created_at)                     as last_order_date
from customers c
left join orders o on o.customer_id = c.id
group by c.id, c.first_name, c.last_name, c.phone, c.created_at
order by total_spent desc;

comment on view customer_summary is 'Customer lifetime value and order statistics';

-- 7.7  discounted_products — active products with variant discount > 0
--      compare_price is derived from product.price (00013).
create or replace view discounted_products as
select
  p.id,
  p.category_id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.price as compare_price,
  p.images,
  p.tags,
  p.is_active,
  p.created_at,
  p.updated_at,
  min(round(p.price * (1 - pv.discount::numeric / 100), 2)) as effective_price,
  max(pv.discount) as max_discount
from products p
join product_variants pv on pv.product_id = p.id
where pv.discount > 0
  and p.is_active = true
group by p.id;

comment on view discounted_products is
  'Active products with at least one variant having discount > 0. The compare_price is derived from product.price.';

-- =============================================================================
-- 8. ROW-LEVEL SECURITY (RLS)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 8.1  CATEGORIES — public SELECT, admin ALL
-- ---------------------------------------------------------------------------
alter table categories enable row level security;

create policy "Categories are visible to everyone"
  on categories for select
  using (true);

create policy "Admin can manage categories"
  on categories for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.2  PRODUCTS — public SELECT (active only), admin ALL
-- ---------------------------------------------------------------------------
alter table products enable row level security;

create policy "Products are visible to everyone (active only)"
  on products for select
  using (is_active = true);

create policy "Admin can manage all products"
  on products for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.3  PRODUCT VARIANTS — public SELECT, admin ALL
-- ---------------------------------------------------------------------------
alter table product_variants enable row level security;

create policy "Variants are visible to everyone"
  on product_variants for select
  using (true);

create policy "Admin can manage variants"
  on product_variants for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.4  CUSTOMERS — owner SELECT/UPDATE, admin ALL
-- ---------------------------------------------------------------------------
alter table customers enable row level security;

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

-- ---------------------------------------------------------------------------
-- 8.5  ORDERS — owner SELECT/UPDATE (via customers relation), admin ALL
-- ---------------------------------------------------------------------------
alter table orders enable row level security;

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

-- ---------------------------------------------------------------------------
-- 8.6  ORDER ITEMS — owner SELECT (via order → customer), admin ALL
-- ---------------------------------------------------------------------------
alter table order_items enable row level security;

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

-- ---------------------------------------------------------------------------
-- 8.7  PURCHASES — admin only
-- ---------------------------------------------------------------------------
alter table purchases enable row level security;

create policy "Admin can manage purchases"
  on purchases for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.8  PURCHASE ITEMS — admin only
-- ---------------------------------------------------------------------------
alter table purchase_items enable row level security;

create policy "Purchase items admin only"
  on purchase_items for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.9  EXPENSES — admin only
-- ---------------------------------------------------------------------------
alter table expenses enable row level security;

create policy "Admin can manage expenses"
  on expenses for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.10  CASH MOVEMENTS — admin only
-- ---------------------------------------------------------------------------
alter table cash_movements enable row level security;

create policy "Admin can manage cash movements"
  on cash_movements for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.11  CART ITEMS — user owns their cart rows
-- ---------------------------------------------------------------------------
alter table cart_items enable row level security;

create policy "Users can manage their own cart"
  on cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their own cart"
  on cart_items for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8.12  PRODUCT QUESTIONS — public read answered/visible, owners read own
--       unanswered, public insert, admin answer + read all
-- ---------------------------------------------------------------------------
alter table product_questions enable row level security;

create policy "Anyone can read answered questions"
  on product_questions for select
  using (answer_text is not null and is_visible = true);

create policy "Users can read own unanswered questions"
  on product_questions for select
  using (
    answer_text is null
    and customer_id in (
      select id from customers where user_id = auth.uid()
    )
  );

create policy "Anyone can insert questions"
  on product_questions for insert
  with check (
    (customer_id is not null or (customer_name is not null and customer_name <> ''))
    and product_id is not null
  );

create policy "Admin can answer questions"
  on product_questions for update
  using (is_admin())
  with check (is_admin());

create policy "Admin can read all questions"
  on product_questions for select
  using (is_admin());

-- ---------------------------------------------------------------------------
-- 8.13  MESSAGES — customer reads/updates own, admin ALL
-- ---------------------------------------------------------------------------
alter table messages enable row level security;

create policy "Customers can read own messages"
  on messages for select
  using (
    exists (
      select 1 from customers
      where customers.id = messages.customer_id
        and customers.user_id = auth.uid()
    )
  );

create policy "Customers can update own messages"
  on messages for update
  using (
    exists (
      select 1 from customers
      where customers.id = messages.customer_id
        and customers.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from customers
      where customers.id = messages.customer_id
        and customers.user_id = auth.uid()
    )
  );

create policy "Admin can manage messages"
  on messages for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 8.14  NOTIFICATION LOGS — admin only
-- ---------------------------------------------------------------------------
alter table notification_logs enable row level security;

create policy "Admin can manage notification logs"
  on notification_logs for all
  using (is_admin())
  with check (is_admin());

create policy "Admin can view notification logs"
  on notification_logs for select
  using (is_admin());

-- =============================================================================
-- 9. GRANTS
-- =============================================================================

-- Schema usage
grant usage on schema public to anon, authenticated;

-- Catalog: public read
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_variants to anon, authenticated;

-- Commerce/back-office: authenticated only (RLS scopes per row)
grant all on public.orders to authenticated;
grant all on public.order_items to authenticated;
grant all on public.customers to authenticated;
grant all on public.purchases to authenticated;
grant all on public.purchase_items to authenticated;
grant all on public.expenses to authenticated;
grant all on public.cash_movements to authenticated;
grant all on public.notification_logs to authenticated;

-- Cart: authenticated + anonymous (RLS scopes by user_id)
grant select, insert, update, delete on cart_items to authenticated;
grant select, insert, update, delete on cart_items to anon;

-- Product questions
grant select on product_questions to anon, authenticated;
grant insert on product_questions to anon, authenticated;
grant update on product_questions to authenticated;

-- Messages
grant select, insert, update on messages to authenticated;

-- Dashboard/analytics views
grant select on monthly_sales to authenticated;
grant select on low_stock to authenticated;
grant select on daily_sales to authenticated;
grant select on top_products to authenticated;
grant select on product_profitability to authenticated;
grant select on customer_summary to authenticated;
grant select on discounted_products to authenticated;
grant select on discounted_products to anon;

-- Functions
grant execute on function public.is_admin to anon, authenticated;
grant execute on function public.set_admin_role to authenticated;
grant execute on function public.remove_admin_role to authenticated;
grant execute on function public.get_admin_users to authenticated;
grant execute on function public.create_order_from_cart to authenticated;
grant execute on function public.create_order_from_cart to anon;

-- Hardened internal helpers: no public/anon/authenticated execution.
-- The original migration only revoked from anon/authenticated; here we also
-- revoke from PUBLIC so the removal is actually effective in Postgres ACL terms.
revoke execute on function public.update_stock_from_purchase(uuid) from public;
revoke execute on function public.auto_create_cash_movement(text, numeric, text, text, uuid) from public;

-- =============================================================================
-- 10. REALTIME PUBLICATION
-- =============================================================================

-- Product Q&A (idempotent — some environments may already have it)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_questions'
  ) then
    alter publication supabase_realtime add table public.product_questions;
  end if;
end $$;

-- Messages (idempotent — some environments may already have it)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- =============================================================================
-- 11. STORAGE BUCKETS
-- =============================================================================

-- Function: ensure_storage_buckets()
-- Creates product-images (public) and receipts (private) buckets if missing.
-- Bucket creation via SQL may be restricted in some environments; if this
-- throws, run the same inserts manually from the Dashboard (Storage → New bucket).
create or replace function public.ensure_storage_buckets()
returns void
language plpgsql
security definer
as $$
begin
  insert into storage.buckets (id, name, public, avif_autodetection)
  values ('product-images', 'product-images', true, false)
  on conflict (id) do nothing;

  insert into storage.buckets (id, name, public, avif_autodetection)
  values ('receipts', 'receipts', false, false)
  on conflict (id) do nothing;
end;
$$;

comment on function public.ensure_storage_buckets is 'Creates storage buckets if they do not exist';

-- Grant AFTER function definition (PostgreSQL requires the function to exist
-- before GRANT EXECUTE, otherwise SQLSTATE 42883)
grant execute on function public.ensure_storage_buckets to authenticated;

do $$
begin
  insert into storage.buckets (id, name, public, avif_autodetection)
  values ('product-images', 'product-images', true, false)
  on conflict (id) do nothing;

  insert into storage.buckets (id, name, public, avif_autodetection)
  values ('receipts', 'receipts', false, false)
  on conflict (id) do nothing;
exception
  when insufficient_privilege then
    raise notice 'Skipping storage bucket creation: not enough privileges in this context. Create buckets manually in the Dashboard.';
end $$;

-- =============================================================================
-- 12. USERS (auth.users)
-- =============================================================================
--
-- IMPORTANT: Supabase Auth (GoTrue) owns the auth.users table. Users are
-- created through the Auth API / Sign-Up flows, NOT via SQL migrations.
-- Password hashing and session/token management live entirely in GoTrue.
--
-- What this schema provides for users:
--
--   1. Auto-profile: the on_auth_user_created trigger (section 6.2) inserts a
--      row into public.customers for every new auth user, hydrating name,
--      phone, and address from OAuth metadata.
--
--   2. Admin role: stored in auth.users.raw_app_meta_data -> 'role' = 'admin'
--      and checked by public.is_admin() for RLS. Promote/demote with the
--      helper functions:
--
--          select public.set_admin_role('<user-uuid>');
--          select public.remove_admin_role('<user-uuid>');
--          select * from public.get_admin_users();
--
--   3. Bootstrap an admin from the Dashboard:
--      a) Authentication → Users → create the account (or let the first
--         person sign up in the app).
--      b) Authentication → Users → edit the user → App Metadata:
--         add  { "role": "admin" }
--      c) OR run in the SQL editor with the service role:
--         select public.set_admin_role('<user-uuid>');
--
-- Direct auth.users INSERT (advanced, last resort):
--   insert into auth.users (
--     instance_id, id, aud, role, email, encrypted_password,
--     email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at,
--     updated_at, confirmation_token, recovery_token
--   ) values (
--     '00000000-0000-0000-0000-000000000000',
--     gen_random_uuid(),
--     'authenticated',
--     'authenticated',
--     'admin@mb.com',
--     crypt('SuperSecret123!', gen_salt('bf')),   -- bcrypt hash (crypt() from pgcrypto)
--     now(),
--     '{"provider":"email","providers":["email"],"role":"admin"}',
--     '{}',
--     now(),
--     now(),
--     '', ''
--   );
--   -- Then enable the account:
--   update auth.users set email_confirmed_at = now() where email = 'admin@mb.com';

-- =============================================================================
-- END OF FULL DATABASE MIGRATION
-- =============================================================================
