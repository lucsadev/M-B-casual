-- =============================================================
-- M&B Trend — Finance Extras: Views, Triggers & Stock Functions
-- Migration: 00005_finance_extras.sql
-- Description:
--   - daily_sales view (daily revenue aggregation)
--   - top_products view (best-selling products)
--   - product_profitability view (margin per product)
--   - customer_summary view (customer lifetime value)
--   - Function: update_stock_from_purchase()
--   - Function: auto_insert_cash_movement()
--   - Trigger: auto cash_movement on expense insert
--   - Trigger: auto cash_movement on purchase insert
--   - Trigger: cash_movement on order 'delivered'
-- Fase 4: Finanzas
-- =============================================================

-- =============================================================
-- 1. VIEWS
-- =============================================================

-- 1.1  daily_sales — dashboard: revenue aggregation by day
create or replace view daily_sales with (security_invoker = true) as
select
  created_at::date                     as day,
  count(*)                             as total_orders,
  sum(total)                           as revenue,
  count(distinct customer_id)          as unique_customers
from orders
where status = 'delivered'
group by created_at::date
order by day desc;

comment on view daily_sales is 'Daily revenue aggregation for dashboard metrics';

-- 1.2  top_products — dashboard: best-selling products
create or replace view top_products with (security_invoker = true) as
select
  p.id,
  p.name,
  p.price,
  coalesce(sum(oi.quantity), 0)        as units_sold,
  count(distinct oi.order_id)          as order_count,
  coalesce(sum(oi.subtotal), 0)        as total_revenue
from products p
left join order_items oi on oi.product_id = p.id
left join orders o on o.id = oi.order_id and o.status = 'delivered'
group by p.id, p.name, p.price
order by total_revenue desc;

comment on view top_products is 'Top-selling products ranked by revenue';

-- 1.3  product_profitability — margin analysis per product
--      Compares total revenue from delivered orders against
--      total cost from purchase_items to estimate gross margin.
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

-- 1.4  customer_summary — customer lifetime value stats
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
left join orders o on o.customer_id = c.id and o.status = 'delivered'
group by c.id, c.first_name, c.last_name, c.phone, c.created_at
order by total_spent desc;

comment on view customer_summary is 'Customer lifetime value and order statistics';

-- =============================================================
-- 2. FUNCTIONS
-- =============================================================

-- 2.1  update_stock_from_purchase()
--      Atomically updates product_variants.stock when a purchase
--      is confirmed. Called manually or from a trigger.
--      Parameters: p_purchase_id uuid
create or replace function update_stock_from_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update variant stock by adding purchased quantity
  update product_variants pv
  set stock = pv.stock + pi.quantity
  from purchase_items pi
  where pi.purchase_id = p_purchase_id
    and pi.variant_id = pv.id
    and pi.variant_id is not null;

  -- For items without variant, log but skip (no stock tracking at product level)
  -- Products without variants are tracked at the variant level only.
end;
$$;

comment on function update_stock_from_purchase is
  'Atomically increments product_variants.stock by purchased quantities';

-- 2.2  auto_create_cash_movement()
--      Helper function that inserts a cash_movement row.
--      Used by triggers below to automate cash flow tracking.
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

-- =============================================================
-- 3. TRIGGERS — Auto cash movements
-- =============================================================

-- 3.1  On expense insert → auto-create cash_movement (expense type)
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

create trigger trg_expense_cash_movement
  after insert on expenses
  for each row
  execute function handle_expense_cash_movement();

comment on trigger trg_expense_cash_movement on expenses is
  'Auto-creates cash_movement row whenever a new expense is recorded';

-- 3.2  On purchase insert → auto-create cash_movement (expense type)
create or replace function handle_purchase_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create cash movement
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

create trigger trg_purchase_cash_movement
  after insert on purchases
  for each row
  execute function handle_purchase_cash_movement();

comment on trigger trg_purchase_cash_movement on purchases is
  'Auto-creates cash_movement when a purchase is registered';

-- 3.3  On purchase_items insert → update stock for each variant
--      NOTE: This must fire AFTER purchase_items are inserted,
--      which happens AFTER the purchase row itself.
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

create trigger trg_purchase_item_stock_update
  after insert on purchase_items
  for each row
  execute function handle_purchase_item_stock_update();

comment on trigger trg_purchase_item_stock_update on purchase_items is
  'Atomically increments variant stock when a purchase item is created';

-- 3.4  On order status change to 'delivered' → auto-create cash_movement (income type)
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

create trigger trg_order_delivered_cash_movement
  after update of status on orders
  for each row
  when (new.status = 'delivered')
  execute function handle_order_delivered_cash_movement();

comment on trigger trg_order_delivered_cash_movement on orders is
  'Auto-creates cash_movement (income) when an order status changes to delivered';

-- =============================================================
-- 4. GRANTS
-- =============================================================

-- Grant select on views to authenticated users
grant select on daily_sales to authenticated;
grant select on top_products to authenticated;
grant select on product_profitability to authenticated;
grant select on customer_summary to authenticated;

-- Grant execute on functions
grant execute on function update_stock_from_purchase to authenticated;
grant execute on function auto_create_cash_movement to authenticated;

-- =============================================================
-- END OF MIGRATION
-- =============================================================
