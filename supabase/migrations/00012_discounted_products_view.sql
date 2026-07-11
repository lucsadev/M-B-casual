-- =============================================================
-- M&B Trend — Discounted Products View
-- Migration: 00012_discounted_products_view.sql
-- Description: Creates a view that lists active products with
--              at least one variant discount > 0, including the
--              minimum effective price and max discount percentage.
-- =============================================================

create or replace view discounted_products as
select
  p.id,
  p.category_id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.compare_price,
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
  'Active products with at least one variant having discount > 0. Includes computed effective_price (cheapest variant after discount) and max_discount (highest variant discount %).';

-- Grant read access
grant select on discounted_products to authenticated;
grant select on discounted_products to anon;
