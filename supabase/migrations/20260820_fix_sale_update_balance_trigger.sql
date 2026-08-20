-- =============================================================================
-- Fix: Recalculate customer balance when an in-person sale is updated
-- =============================================================================
-- The existing trg_update_customer_balance_sale only fires on INSERT.
-- This migration adds:
-- 1. AFTER UPDATE trigger to recalculate customer balance
-- 2. AFTER UPDATE trigger to sync cash_movement amount with amount_paid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Customer balance recalculation on sale update
-- -----------------------------------------------------------------------------
create or replace function update_customer_balance_on_sale_update()
returns trigger as $$
declare
  old_balance_change numeric(10,2);
  new_balance_change numeric(10,2);
  net_change numeric(10,2);
begin
  if NEW.customer_id is not null then
    -- OLD balance impact (what was applied on insert)
    old_balance_change := OLD.total * (1 - OLD.discount / 100) - OLD.amount_paid - OLD.balance_used;
    -- NEW balance impact
    new_balance_change := NEW.total * (1 - NEW.discount / 100) - NEW.amount_paid - NEW.balance_used;
    -- Net change
    net_change := new_balance_change - old_balance_change;

    if net_change != 0 then
      update in_person_customers
      set balance = balance + net_change,
          updated_at = now()
      where id = NEW.customer_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_update_customer_balance_sale_update
  after update on in_person_sales
  for each row
  execute function update_customer_balance_on_sale_update();

-- -----------------------------------------------------------------------------
-- 2. Sync cash_movement amount when amount_paid changes
-- -----------------------------------------------------------------------------
create or replace function update_cash_movement_on_sale_update()
returns trigger as $$
begin
  -- Only update if amount_paid actually changed
  if OLD.amount_paid is distinct from NEW.amount_paid then
    update cash_movements
    set amount = NEW.amount_paid
    where reference_type = 'in_person_sale'
      and reference_id = NEW.id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_update_cash_movement_sale_update
  after update on in_person_sales
  for each row
  execute function update_cash_movement_on_sale_update();
