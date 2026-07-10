-- =============================================================
-- M&B Casual — Denormalized customer_name on orders
-- Migration: 00010_orders_customer_name.sql
-- Adds customer_name to orders so name search uses a native column
-- instead of a fragile embedded-relation filter inside .or().
-- =============================================================

alter table orders add column if not exists customer_name text;

-- Backfill existing orders
update orders o
set customer_name = trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, ''))
from customers c
where c.id = o.customer_id;

-- Populate customer_name on insert (looks up the customer)
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

drop trigger if exists trg_set_order_customer_name on orders;
create trigger trg_set_order_customer_name
  before insert on orders
  for each row
  execute function set_order_customer_name();

-- Keep customer_name in sync when a customer renames
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

drop trigger if exists trg_sync_order_customer_name on customers;
create trigger trg_sync_order_customer_name
  after update of first_name, last_name on customers
  for each row
  execute function sync_order_customer_name();

comment on column orders.customer_name is 'Denormalized customer full name for search';
comment on trigger trg_set_order_customer_name on orders is 'Looks up customer_name on order insert';
comment on trigger trg_sync_order_customer_name on customers is 'Keeps orders.customer_name in sync when a customer renames';
