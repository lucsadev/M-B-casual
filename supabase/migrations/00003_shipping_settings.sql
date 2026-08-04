-- =============================================================================
-- 00003: Shipping settings (free-shipping minimum + shipping cost)
--
-- Adds a single-row settings table editable from the admin panel. Both the
-- checkout RPC (server truth) and the client cart summary (display) read
-- these values to calculate shipping:
--
--   shipping = 0                    when subtotal >= free_shipping_min
--   shipping = shipping_cost        otherwise
--
-- Default row keeps the previous behavior (free shipping always) until the
-- admin configures real values.
-- =============================================================================

-- 1. Table (single-row enforced via id = true check)
create table public.shipping_settings (
  id                boolean primary key default true check (id = true),
  free_shipping_min numeric(10,2) not null default 0 check (free_shipping_min >= 0),
  shipping_cost     numeric(10,2) not null default 0 check (shipping_cost >= 0),
  updated_at        timestamptz   not null default now()
);

comment on table public.shipping_settings is
  'Configuración de envío: monto mínimo para envío gratis y costo de envío.';
comment on column public.shipping_settings.free_shipping_min is
  'Subtotal mínimo para que el envío sea gratis.';
comment on column public.shipping_settings.shipping_cost is
  'Costo de envío cuando no se alcanza el mínimo.';

-- 2. Seed default row (preserves current behavior: free shipping)
insert into public.shipping_settings (id, free_shipping_min, shipping_cost)
values (true, 0, 0)
on conflict (id) do nothing;

-- 3. RLS: public read (cart display for anon + authenticated), admin manage
alter table public.shipping_settings enable row level security;

create policy "Shipping settings are visible to everyone"
  on public.shipping_settings for select
  using (true);

create policy "Admin can manage shipping settings"
  on public.shipping_settings for all
  using (is_admin())
  with check (is_admin());

-- 4. Grants (matches project conventions: catalog-like public read, admin write)
grant select on public.shipping_settings to anon, authenticated;
grant all on public.shipping_settings to authenticated;

-- 5. Checkout RPC: read shipping settings instead of hardcoding 0.
--    Falls back to free shipping if the row is missing or settings are 0.
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
  v_user_id          uuid;
  v_customer_id      uuid;
  v_order_id         uuid;
  v_total            numeric(10,2);
  v_free_shipping_min numeric(10,2) := 0;
  v_shipping_cost    numeric(10,2) := 0;
  v_cart_count       int;
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

  -- 4b. Load shipping settings (fallback: free shipping)
  select coalesce(free_shipping_min, 0), coalesce(shipping_cost, 0)
  into v_free_shipping_min, v_shipping_cost
  from shipping_settings
  where id = true;

  if v_total >= v_free_shipping_min then
    v_shipping_cost := 0;
  end if;

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
