-- =============================================================
-- M&B Trend — Finance Triggers & Purchase Status
-- Migration: 00006_finance_triggers.sql
-- Description:
--   - Add status column to purchases for confirm flow
--   - Replace order trigger from 'delivered' to 'confirmed'
--   - Add purchase confirm stock trigger (purchase-level)
--   - Recreate expense/purchase cash movement triggers
-- Fase 4: Finanzas
-- =============================================================

-- =============================================================
-- 1. SCHEMA CHANGES
-- =============================================================

-- Add status column to purchases for confirm flow
alter table purchases add column if not exists status text not null default 'pending'
  check (status in ('pending', 'confirmed'));

comment on column purchases.status is 'pending | confirmed — triggers stock update on confirm';

-- =============================================================
-- 2. DROP OLD TRIGGERS AND ORPHANED FUNCTIONS
-- =============================================================

-- Order: old 'delivered' trigger → replaced by 'confirmed'
drop trigger if exists trg_order_delivered_cash_movement on orders;
drop function if exists handle_order_delivered_cash_movement;

-- Purchase stock: old per-item trigger → replaced by purchase-level confirm
drop trigger if exists trg_purchase_item_stock_update on purchase_items;
drop function if exists handle_purchase_item_stock_update;

-- Recreate expense/purchase triggers to use direct INSERT instead of helper fn
-- (keep the old helper function for backward compat but triggers bypass it)
drop trigger if exists trg_expense_cash_movement on expenses;
drop trigger if exists trg_purchase_cash_movement on purchases;

-- =============================================================
-- 3. TRIGGER FUNCTIONS
-- =============================================================

-- 3.1  Order confirmed → cash movement (income)
--      Replaces old 'delivered' trigger from migration 00005
--      Spec: type=income, amount=order.total, reference_type=order
create or replace function handle_order_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    insert into cash_movements (
      type, amount, description, reference_type, reference_id, movement_date
    ) values (
      'income',
      new.total,
      'Orden #' || substring(new.id::text, 1, 8),
      'order',
      new.id,
      current_date
    );
  end if;
  return new;
end;
$$;

comment on function handle_order_cash_movement is
  'Auto-creates cash_movement (income) when order status changes to confirmed';

create trigger trg_order_cash_movement
  after update of status on orders
  for each row
  when (new.status = 'confirmed')
  execute function handle_order_cash_movement();

comment on trigger trg_order_cash_movement on orders is
  'Auto-creates cash_movement when an order is confirmed';

-- 3.2  Expense insert → cash movement (expense)
--      Spec: type=expense, amount=expense.amount, reference_type=expense
create or replace function handle_expense_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into cash_movements (
    type, amount, description, reference_type, reference_id, movement_date
  ) values (
    'expense',
    new.amount,
    new.description,
    'expense',
    new.id,
    new.expense_date
  );
  return new;
end;
$$;

comment on function handle_expense_cash_movement is
  'Auto-creates cash_movement (expense) when a new expense is recorded';

create trigger trg_expense_cash_movement
  after insert on expenses
  for each row
  execute function handle_expense_cash_movement();

comment on trigger trg_expense_cash_movement on expenses is
  'Auto-creates cash_movement when an expense is inserted';

-- 3.3  Purchase insert → cash movement (expense)
--      Spec: type=expense, amount=purchase.total, reference_type=purchase
create or replace function handle_purchase_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into cash_movements (
    type, amount, description, reference_type, reference_id, movement_date
  ) values (
    'expense',
    new.total,
    'Compra: ' || new.supplier_name,
    'purchase',
    new.id,
    new.purchase_date
  );
  return new;
end;
$$;

comment on function handle_purchase_cash_movement is
  'Auto-creates cash_movement (expense) when a purchase is registered';

create trigger trg_purchase_cash_movement
  after insert on purchases
  for each row
  execute function handle_purchase_cash_movement();

comment on trigger trg_purchase_cash_movement on purchases is
  'Auto-creates cash_movement when a purchase is inserted';

-- 3.4  Purchase confirm → stock update
--      Replaces old per-item stock trigger from migration 00005
--      Spec: on status='confirmed', for each purchase_item:
--            UPDATE product_variants SET stock = stock + quantity
create or replace function handle_purchase_confirm_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    -- Update variant stock for items with variant_id
    update product_variants pv
    set stock = pv.stock + pi.quantity
    from purchase_items pi
    where pi.purchase_id = new.id
      and pi.variant_id = pv.id
      and pi.variant_id is not null;
  end if;
  return new;
end;
$$;

comment on function handle_purchase_confirm_stock is
  'Atomically increments variant stock when a purchase is confirmed';

create trigger trg_purchase_confirm_stock
  after update of status on purchases
  for each row
  when (new.status = 'confirmed')
  execute function handle_purchase_confirm_stock();

comment on trigger trg_purchase_confirm_stock on purchases is
  'Auto-updates product_variants.stock when a purchase is confirmed';

-- =============================================================
-- END OF MIGRATION
-- =============================================================
