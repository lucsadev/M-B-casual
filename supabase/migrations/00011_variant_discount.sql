-- =============================================================
-- M&B Trend — Variant Discount
-- Migration: 00011_variant_discount.sql
-- Description: Adds per-variant discount percentage and updates
--              the create_order_from_cart RPC to use it.
-- =============================================================

-- =============================================================
-- 1. ADD DISCOUNT COLUMN
-- =============================================================

alter table product_variants
  add column discount int not null default 0;

comment on column product_variants.discount is
  'Discount percentage (0-100) applied on top of the base product.price. E.g. 30 = 30% off.';

-- =============================================================
-- 2. UPDATE create_order_from_cart RPC
--    Now considers variant-level discount when calculating
--    unit_price and order total.
-- =============================================================

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
