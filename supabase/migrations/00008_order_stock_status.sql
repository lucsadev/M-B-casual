-- =============================================================
-- M&B Casual — Order stock on status change (both directions)
-- Migration: 00008_order_stock_status.sql
-- Fix: when an order leaves 'cancelled' back to an active status,
--       stock must be re-decremented (it was returned on cancel).
-- Replaces the cancel-only trigger from 00007.
-- =============================================================

-- Drop previous cancel-only implementation
drop trigger if exists trg_order_cancel_stock_return on orders;
drop function if exists handle_order_cancel_stock_return();

-- Adjust variant stock on order status transitions that change
-- whether the order consumes inventory:
--   INTO 'cancelled'   -> return stock (order no longer consumes)
--   OUT OF 'cancelled' -> re-decrement stock (order active again)
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

drop trigger if exists trg_order_status_stock_adjust on orders;
create trigger trg_order_status_stock_adjust
  after update on orders
  for each row
  execute function handle_order_status_stock_adjust();

comment on trigger trg_order_status_stock_adjust on orders is
  'Returns variant stock when an order is cancelled and re-decrements when it leaves cancelled';
