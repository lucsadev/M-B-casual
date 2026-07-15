-- =============================================================
-- M&B Trend — Drop compare_price from products
-- Migration: 00013_drop_compare_price.sql
-- Description: Removes the manually-entered compare_price column.
--              The compare (crossed-out) price is now computed
--              automatically from variant discounts:
--              base product.price becomes the compare price when
--              any variant has a discount > 0.
-- =============================================================

-- 1. Recreate the view first (it references compare_price)
--    The view now uses p.price as the reference price instead
--    of the removed compare_price column.
create or replace view discounted_products as
select
  p.id,
  p.category_id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.price as compare_price,
  p.images,
  p.tags,
  p.is_active,
  p.created_at,
  p.updated_at,
  min(round(p.price * (1 - pv.discount::numeric / 100), 2)) as effective_price,
  max(pv.discount) as max_discount
from products p
join product_variants pv on pv.product_id = p.id
where pv.discount > 0
  and p.is_active = true
group by p.id;

comment on view discounted_products is
  'Active products with at least one variant having discount > 0. The compare_price is derived from product.price.';

-- 2. Drop the now-unused column
alter table products drop column if exists compare_price;
