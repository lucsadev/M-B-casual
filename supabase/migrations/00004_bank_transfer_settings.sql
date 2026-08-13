-- =============================================================================
-- 00004: Bank transfer settings + auto-message on transfer orders
--
-- Adds a single-row settings table for bank transfer details (CBU, alias,
-- titular, bank name). When a customer places an order paying by transferencia,
-- the create_order_from_cart RPC inserts an in-app message with the transfer
-- instructions and order total.
-- =============================================================================

-- 1. Table (single-row enforced via id = true check — same pattern as shipping_settings)
create table public.bank_transfer_settings (
  id          boolean   primary key default true check (id = true),
  alias       text      not null default '',
  cbu         text      not null default '',
  titular     text      not null default '',
  banco       text      not null default '',
  extra_info  text      not null default '',
  updated_at  timestamptz not null default now()
);

comment on table public.bank_transfer_settings is
  'Datos de transferencia bancaria que se muestran al cliente al confirmar una orden por transferencia.';
comment on column public.bank_transfer_settings.alias is
  'Alias de la cuenta bancaria.';
comment on column public.bank_transfer_settings.cbu is
  'CBU / CVU de la cuenta.';
comment on column public.bank_transfer_settings.titular is
  'Nombre del titular de la cuenta.';
comment on column public.bank_transfer_settings.banco is
  'Nombre del banco.';
comment on column public.bank_transfer_settings.extra_info is
  'Información adicional (ej:Concepto a enviar, horarios, etc).';

-- 2. Seed default row (empty — admin must configure before first use)
insert into public.bank_transfer_settings (id, alias, cbu, titular, banco, extra_info)
values (true, '', '', '', '', '')
on conflict (id) do nothing;

-- 3. RLS: public read (confirmation page + message rendering), admin manage
alter table public.bank_transfer_settings enable row level security;

create policy "Bank transfer settings are visible to everyone"
  on public.bank_transfer_settings for select
  using (true);

create policy "Admin can manage bank transfer settings"
  on public.bank_transfer_settings for all
  using (is_admin())
  with check (is_admin());

-- 4. Grants
grant select on public.bank_transfer_settings to anon, authenticated;
grant all on public.bank_transfer_settings to authenticated;

-- 5. Extend create_order_from_cart to auto-message on transferencia payment
--    This replaces the existing function with the new version that:
--    - Reads bank_transfer_settings
--    - When p_payment_method = 'transferencia', inserts an in-app message
--      with transfer instructions + order total
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
  v_order_number     text;
  -- Transfer settings
  v_alias            text;
  v_cbu              text;
  v_titular          text;
  v_banco            text;
  v_extra_info       text;
  v_message_body     text;
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

  -- 4. Calculate total using pack-aware split CTE
  --    For pack products (pack_units NOT NULL): floor cents per unit, last row absorbs remainder
  --    For non-pack products: identical to previous behavior (unit_price = discounted price)
  with priced as (
    select
      ci.id,
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      p.pack_units,
      round(p.price * (1 - coalesce(pv.discount, 0)::numeric / 100), 2) as base,
      row_number() over (partition by ci.product_id order by ci.created_at, ci.id) as rn,
      count(*) over (partition by ci.product_id) as cnt
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants pv on pv.id = ci.variant_id
    where ci.user_id = v_user_id
  ),
  split as (
    select
      *,
      case when pack_units is not null
           then floor(base * 100 / pack_units) / 100
           else base end as unit_price,
      case when pack_units is not null
           then mod((base * 100)::int, pack_units)::numeric / 100
           else 0 end as remainder
    from priced
  )
  select coalesce(sum(
    unit_price * quantity
    + case when pack_units is not null and rn = cnt then remainder else 0 end
  ), 0)
  into v_total
  from split;

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

  -- 5b. Generate short order number for display (first 8 chars of uuid)
  v_order_number := left(v_order_id::text, 8);

  -- 6. Insert order_items with pack-aware split pricing
  --    Re-define the priced/split CTEs (CTEs are statement-scoped in PostgreSQL)
  with priced as (
    select
      ci.id,
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      p.pack_units,
      round(p.price * (1 - coalesce(pv.discount, 0)::numeric / 100), 2) as base,
      row_number() over (partition by ci.product_id order by ci.created_at, ci.id) as rn,
      count(*) over (partition by ci.product_id) as cnt
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants pv on pv.id = ci.variant_id
    where ci.user_id = v_user_id
  ),
  split as (
    select
      *,
      case when pack_units is not null
           then floor(base * 100 / pack_units) / 100
           else base end as unit_price,
      case when pack_units is not null
           then mod((base * 100)::int, pack_units)::numeric / 100
           else 0 end as remainder
    from priced
  )
  insert into order_items (
    order_id, product_id, variant_id, quantity, unit_price, subtotal
  )
  select
    v_order_id,
    product_id,
    variant_id,
    quantity,
    unit_price,
    unit_price * quantity
    + case when pack_units is not null and rn = cnt then remainder else 0 end
  from split;

  -- 7. Clear cart
  delete from cart_items
  where user_id = v_user_id;

  -- 8. Auto-message: transfer instructions when payment is transferencia
  if p_payment_method = 'transferencia' then
    -- Read bank transfer settings
    select alias, cbu, titular, banco, extra_info
    into v_alias, v_cbu, v_titular, v_banco, v_extra_info
    from bank_transfer_settings
    where id = true;

    -- Only send message if transfer details are configured
    if (v_alias <> '' or v_cbu <> '') and (v_titular <> '' or v_banco <> '') then
      v_message_body := 'Para confirmar tu pedido #' || v_order_number
        || ', realizá una transferencia por $' || trim(to_char(v_total + v_shipping_cost, 'FM999G999G999D99'))
        || ' a la siguiente cuenta:'
        || E'\n\n';

      if v_banco <> '' then
        v_message_body := v_message_body || 'Banco: ' || v_banco || E'\n';
      end if;
      if v_titular <> '' then
        v_message_body := v_message_body || 'Titular: ' || v_titular || E'\n';
      end if;
      if v_alias <> '' then
        v_message_body := v_message_body || 'Alias: ' || v_alias || E'\n';
      end if;
      if v_cbu <> '' then
        v_message_body := v_message_body || 'CBU/CVU: ' || v_cbu || E'\n';
      end if;
      if v_extra_info <> '' then
        v_message_body := v_message_body || E'\n' || v_extra_info;
      end if;

      insert into messages (customer_id, order_id, type, title, body, is_read, created_at)
      values (
        v_customer_id,
        v_order_id,
        'payment_status',
        'Datos de transferencia bancaria',
        v_message_body,
        false,
        now()
      );
    end if;
  end if;

  -- 9. Return the new order id
  return v_order_id;
end;
$$;
