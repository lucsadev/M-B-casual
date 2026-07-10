-- =============================================================
-- M&B Casual — Order stock decrement
-- Migration: 00007_order_stock.sql
-- Description: Decrements product_variants.stock when an order
--              item is created (sale), and returns it when the
--              order is cancelled.
-- Fix: stock was never reduced when an order was processed.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Decrement variant stock on order item insert (sale)
--    Fires for checkout (create_order_from_cart) AND admin
--    created orders, since both insert order_items.
-- -------------------------------------------------------------
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

drop trigger if exists trg_order_item_stock_decrement on order_items;
create trigger trg_order_item_stock_decrement
  after insert on order_items
  for each row
  execute function handle_order_item_stock_decrement();

comment on trigger trg_order_item_stock_decrement on order_items is
  'Decrements product_variants.stock when an order item is created (covers checkout and admin-created orders)';

-- -------------------------------------------------------------
-- 2. Return variant stock when an order is cancelled
--    Only on the transition INTO cancelled, so stock is never
--    returned twice.
-- -------------------------------------------------------------
create or replace function handle_order_cancel_stock_return()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status is distinct from NEW.status
     and OLD.status <> 'cancelled'
     and NEW.status = 'cancelled' then
    update product_variants pv
    set stock = pv.stock + oi.quantity
    from order_items oi
    where oi.order_id = NEW.id
      and oi.variant_id is not null
      and pv.id = oi.variant_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_order_cancel_stock_return on orders;
create trigger trg_order_cancel_stock_return
  after update on orders
  for each row
  execute function handle_order_cancel_stock_return();

comment on trigger trg_order_cancel_stock_return on orders is
  'Returns product_variants.stock when an order transitions to cancelled';
