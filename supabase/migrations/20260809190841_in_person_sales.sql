-- =============================================================================
-- M&B Trend — In-Person Sales Tables
-- =============================================================================
-- New tables for in-person customer management and sales:
-- - in_person_customers: walk-in customers (NOT linked to auth.users)
-- - in_person_sales: sales transactions
-- - in_person_sale_items: line items for each sale
--
-- Includes triggers for:
-- - Stock decrement on sale item insert (BEFORE, fails if insufficient)
-- - Cash movement creation on sale insert (AFTER)
-- - Customer balance update on sale insert (AFTER)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. IN_PERSON_CUSTOMERS
-- Walk-in customers with balance tracking (not linked to auth.users)
-- -----------------------------------------------------------------------------
create table in_person_customers (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  phone      text,
  email      text,
  address    text,
  notes      text,
  balance    numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table in_person_customers is 'Walk-in customers for in-person sales (not linked to auth.users)';
comment on column in_person_customers.balance is 'Current balance owed by customer (positive = customer owes, negative = overpayment)';

-- Index for phone search
create index idx_in_person_customers_phone on in_person_customers(phone);
create index idx_in_person_customers_name on in_person_customers using gin(name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 2. IN_PERSON_SALES
-- Sales transactions with discount and balance tracking
-- -----------------------------------------------------------------------------
create table in_person_sales (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid references in_person_customers(id) on delete set null,
  total         numeric(10,2) not null,
  discount      numeric(10,2) not null default 0,
  amount_paid   numeric(10,2) not null,
  balance_used  numeric(10,2) not null default 0,
  payment_method text not null check (payment_method in ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
  notes         text,
  created_by    uuid,
  created_at    timestamptz not null default now()
);

comment on table in_person_sales is 'In-person sales transactions';
comment on column in_person_sales.discount is 'Total discount applied to sale (fixed amount)';
comment on column in_person_sales.amount_paid is 'Amount actually paid by customer';
comment on column in_person_sales.balance_used is 'Customer balance applied to this sale';

-- Index for customer sales history
create index idx_in_person_sales_customer on in_person_sales(customer_id);
create index idx_in_person_sales_created_at on in_person_sales(created_at desc);

-- -----------------------------------------------------------------------------
-- 3. IN_PERSON_SALE_ITEMS
-- Line items linking sales to product variants
-- -----------------------------------------------------------------------------
create table in_person_sale_items (
  id         uuid primary key default uuid_generate_v4(),
  sale_id    uuid not null references in_person_sales(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  quantity   int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  discount   int not null default 0 check (discount >= 0 and discount <= 100),
  subtotal   numeric(10,2) not null
);

comment on table in_person_sale_items is 'Line items for in-person sales';
comment on column in_person_sale_items.discount is 'Discount percentage on this item (0-100)';

-- Index for stock lookups
create index idx_in_person_sale_items_variant on in_person_sale_items(variant_id);

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: Stock decrement on sale item insert
-- BEFORE INSERT - fails if insufficient stock
-- -----------------------------------------------------------------------------
create or replace function decrement_stock_on_in_person_sale()
returns trigger as $$
declare
  current_stock int;
begin
  if NEW.variant_id is not null then
    -- Get current stock
    select stock into current_stock
    from product_variants
    where id = NEW.variant_id;

    if current_stock is null then
      raise exception 'Variant % not found', NEW.variant_id;
    end if;

    if current_stock < NEW.quantity then
      raise exception 'Insufficient stock for variant %. Available: %, Requested: %',
        NEW.variant_id, current_stock, NEW.quantity;
    end if;

    -- Decrement stock
    update product_variants
    set stock = stock - NEW.quantity
    where id = NEW.variant_id;

  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_decrement_stock_in_person_sale
  before insert on in_person_sale_items
  for each row
  execute function decrement_stock_on_in_person_sale();

-- -----------------------------------------------------------------------------
-- 4b. TRIGGER: Stock increment on sale item delete
-- BEFORE DELETE - returns stock to product_variants when item removed from sale
-- Handles: user removes item before completing sale, or sale cancelled/deleted
-- -----------------------------------------------------------------------------
create or replace function increment_stock_on_in_person_sale_delete()
returns trigger as $$
begin
  if OLD.variant_id is not null then
    update product_variants
    set stock = stock + OLD.quantity
    where id = OLD.variant_id;
  end if;
  return OLD;
end;
$$ language plpgsql;

create trigger trg_increment_stock_in_person_sale_delete
  before delete on in_person_sale_items
  for each row
  execute function increment_stock_on_in_person_sale_delete();

-- -----------------------------------------------------------------------------
-- 5. TRIGGER: Cash movement on sale insert
-- AFTER INSERT - create cash_movement for accounting
-- -----------------------------------------------------------------------------
create or replace function create_cash_movement_on_in_person_sale()
returns trigger as $$
begin
  insert into cash_movements (type, amount, reference_type, reference_id, description, created_at)
  values (
    'income',
    NEW.amount_paid,
    'in_person_sale',
    NEW.id,
    'Venta presencial' || case when NEW.customer_id is not null then ' - Cliente: ' || (select name from in_person_customers where id = NEW.customer_id) else '' end,
    NEW.created_at
  );

  return new;
end;
$$ language plpgsql;

create trigger trg_cash_movement_in_person_sale
  after insert on in_person_sales
  for each row
  execute function create_cash_movement_on_in_person_sale();

-- -----------------------------------------------------------------------------
-- 6. TRIGGER: Customer balance update on sale
-- AFTER INSERT - update customer balance if underpaid
-- discount is percentage (0-100), so we calculate discount_amount from total
-- -----------------------------------------------------------------------------
create or replace function update_customer_balance_on_sale()
returns trigger as $$
declare
  balance_change numeric(10,2);
  discount_amount numeric(10,2);
begin
  if NEW.customer_id is not null then
    -- Calculate discount amount from percentage
    discount_amount := NEW.total * (NEW.discount / 100);
    -- Calculate balance change: total - discount_amount - amount_paid - balance_used
    -- Positive = customer owes more, Negative = customer overpaid
    balance_change := (NEW.total - discount_amount - NEW.amount_paid - NEW.balance_used);

    if balance_change != 0 then
      update in_person_customers
      set balance = balance + balance_change,
          updated_at = now()
      where id = NEW.customer_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_update_customer_balance_sale
  after insert on in_person_sales
  for each row
  execute function update_customer_balance_on_sale();

-- -----------------------------------------------------------------------------
-- 7. TRIGGER: Update timestamp on customers
-- -----------------------------------------------------------------------------
create or replace function update_in_person_customer_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_in_person_customer_timestamp
  before update on in_person_customers
  for each row
  execute function update_in_person_customer_timestamp();

-- -----------------------------------------------------------------------------
-- 8. RLS POLICIES
-- All tables are admin-only (no public access)
-- -----------------------------------------------------------------------------

-- Enable RLS
alter table in_person_customers enable row level security;
alter table in_person_sales enable row level security;
alter table in_person_sale_items enable row level security;

-- Admin-only policies
create policy "Admins can manage in_person_customers"
  on in_person_customers
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins can manage in_person_sales"
  on in_person_sales
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins can manage in_person_sale_items"
  on in_person_sale_items
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());
