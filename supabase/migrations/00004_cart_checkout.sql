-- =============================================================
-- M&B Trend — Cart Items + Checkout
-- Migration: 00004_cart_checkout.sql
-- Description: Creates cart_items table (if not exists), RLS,
--              and the create_order_from_cart RPC that atomically
--              creates an order from the current user's cart.
-- Fase 2: Cart + Checkout
-- =============================================================

-- =============================================================
-- 1. CART ITEMS TABLE
-- Idempotent: uses IF NOT EXISTS so it's safe if already applied
-- =============================================================

create table if not exists cart_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null,  -- references auth.users(id)
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  quantity    int not null check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table cart_items is 'Shopping cart items per user (anonymous or authenticated)';
comment on column cart_items.user_id is 'FK to auth.users(id) — enforced at application layer';
comment on column cart_items.variant_id is 'Nullable: null means no variant selected';

-- =============================================================
-- 2. INDEXES
-- =============================================================

create index if not exists idx_cart_items_user
  on cart_items (user_id);
create index if not exists idx_cart_items_product
  on cart_items (product_id);
create index if not exists idx_cart_items_user_product_variant
  on cart_items (user_id, product_id, variant_id);

-- =============================================================
-- 3. ROW-LEVEL SECURITY
-- =============================================================

alter table cart_items enable row level security;

-- Users can only see their own cart items
drop policy if exists "Users can view their own cart items" on cart_items;
create policy "Users can view their own cart items"
  on cart_items for select
  using (auth.uid() = user_id);

-- Users can insert their own cart items
drop policy if exists "Users can insert their own cart items" on cart_items;
create policy "Users can insert their own cart items"
  on cart_items for insert
  with check (auth.uid() = user_id);

-- Users can update their own cart items
drop policy if exists "Users can update their own cart items" on cart_items;
create policy "Users can update their own cart items"
  on cart_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own cart items
drop policy if exists "Users can delete their own cart items" on cart_items;
create policy "Users can delete their own cart items"
  on cart_items for delete
  using (auth.uid() = user_id);

-- =============================================================
-- 4. CART ITEMS TRIGGER — auto updated_at
-- =============================================================

drop trigger if exists trg_cart_items_updated_at on cart_items;
create trigger trg_cart_items_updated_at
  before update on cart_items
  for each row
  execute function set_updated_at();

-- =============================================================
-- 5. CREATE ORDER FROM CART RPC
-- =============================================================

/**
 * create_order_from_cart
 *
 * Atomically creates an order from the current user's cart items.
 *
 * Flow:
 * 1. Resolves auth.uid() → customer_id from the customers table
 * 2. Inserts a new `orders` row with status = 'pending'
 * 3. Inserts `order_items` rows from cart_items (snapshot of unit_price)
 * 4. Deletes all cart_items for this user
 * 5. Returns the new order UUID
 *
 * Raises exceptions on:
 * - Unauthenticated user (auth.uid() is null)
 * - Customer profile not found
 * - Empty cart
 *
 * Security: SECURITY DEFINER so the function can read/write tables
 *           that the user has RLS access to, but within the function
 *           we use the definer's privileges while still using auth.uid()
 *           to identify the user.
 */
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
  v_shipping_cost numeric(10,2) := 0;  -- Flat rate (0 for now)
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

  -- 4. Calculate total from cart items (sum of unit_price * quantity)
  select coalesce(sum(p.price * ci.quantity), 0)
  into v_total
  from cart_items ci
  join products p on p.id = ci.product_id
  where ci.user_id = v_user_id;

  -- 5. Insert order
  insert into orders (
    customer_id,
    status,
    total,
    shipping_cost,
    discount,
    payment_method,
    payment_status,
    shipping_address,
    notes,
    created_at,
    updated_at
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

  -- 6. Insert order_items from cart_items
  insert into order_items (
    order_id,
    product_id,
    variant_id,
    quantity,
    unit_price,
    subtotal
  )
  select
    v_order_id,
    ci.product_id,
    ci.variant_id,
    ci.quantity,
    p.price,
    p.price * ci.quantity
  from cart_items ci
  join products p on p.id = ci.product_id
  where ci.user_id = v_user_id;

  -- 7. Clear cart
  delete from cart_items
  where user_id = v_user_id;

  -- 8. Return the new order id
  return v_order_id;
end;
$$;

comment on function public.create_order_from_cart is
  'Creates an order from the current user''s cart items. Returns the new order UUID.';

-- =============================================================
-- 6. GRANT PERMISSIONS
-- =============================================================

-- Cart items: authenticated users can CRUD their own (RLS handles scoping)
grant select, insert, update, delete on cart_items to authenticated;
grant select, insert, update, delete on cart_items to anon;

-- Execute the RPC
grant execute on function public.create_order_from_cart to authenticated;
grant execute on function public.create_order_from_cart to anon;

-- =============================================================
-- END OF MIGRATION
-- =============================================================
