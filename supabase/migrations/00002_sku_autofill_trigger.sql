-- =============================================================================
-- M&B Trend — AUTO-FILL SKU for product_variants
-- =============================================================================
-- Defensive fallback that auto-generates a deterministic SKU when a variant row
-- is inserted/updated with a NULL sku. The primary generator is the shared TS
-- util `generateSku` (@mbt/shared, PR #1); this trigger mirrors it in PL/pgSQL so
-- direct DB writes (seed, import, admin console) never leave a variant without a
-- SKU. The two paths MUST produce identical strings for identical inputs.
--
-- SKU format (mirrors packages/shared/src/utils/sku.ts):
--   {CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3?}-{NNN}
--   - CAT_SLUG / PRODUCT_SLUG: categories.slug / products.slug, lowercased.
--     DB slugs are pre-sanitized via generateSlug at creation, so lower() is
--     idempotent and matches the util's `generateSlug(slug)` call.
--   - SIZE: slugify + UPPER; NULL/empty or "Único"/"Única" (diacritic-insensitive)
--     -> "UNI". Diacritics are otherwise PRESERVED ([:alnum:] is Unicode-aware).
--   - COLOR3: 3-char slugify + UPPER, diacritics PRESERVED; omitted when the color
--     is NULL/empty/blank (per spec — NOT the design draft's "GEN" fallback).
--   - NNN: 1-based per-product sequence (existing count + 1), zero-padded to 3;
--     bumped on collision up to 100 attempts, then RAISES an exception (mirrors
--     generateSku's MAX_RETRY_ATTEMPTS = 100).
--
-- Idempotent: drops trigger + functions before recreating. Re-running the
-- backfill is a no-op once every sku is populated.
-- =============================================================================

-- Drop in dependency order (trigger first, then its function, then the helper).
drop trigger if exists trg_variant_sku_autofill on product_variants;
drop function if exists public.gen_variant_sku(uuid, text, text);
drop function if exists public.variant_sku_base(uuid, text, text);

-- -----------------------------------------------------------------------------
-- Helper: build the deterministic SKU base {cat}-{prod}-{size}-{color3?}
-- (without the ordinal segment). Shared by gen_variant_sku() and the one-time
-- backfill so both paths emit IDENTICAL bases for identical inputs.
-- -----------------------------------------------------------------------------
create or replace function public.variant_sku_base(p_product_id uuid, p_size text, p_color text)
returns text
language plpgsql
as $$
declare
  v_cat       text;
  v_prod      text;
  v_size      text;
  v_color_seg text := '';   -- '-XXX' or ''
begin
  select lower(c.slug), lower(p.slug)
    into v_cat, v_prod
  from products p
  join categories c on c.id = p.category_id
  where p.id = p_product_id;

  -- SIZE: UNI for NULL/empty/"Único"/"Única" (diacritic-insensitive compare);
  -- otherwise slugify + UPPER, diacritics preserved.
  if p_size is null or trim(p_size) = '' then
    v_size := 'UNI';
  elsif lower(trim(p_size)) in ('único', 'única', 'unico', 'unica') then
    v_size := 'UNI';
  else
    v_size := upper(btrim(regexp_replace(lower(trim(p_size)), '[^[:alnum:]]+', '-', 'g'), '-'));
  end if;

  -- COLOR3: 3-char slugify + UPPER, diacritics preserved; omitted when absent.
  if p_color is not null and trim(p_color) <> '' then
    v_color_seg := '-' || upper(
      left(btrim(regexp_replace(lower(trim(p_color)), '[^[:alnum:]]+', '-', 'g'), '-'), 3)
    );
  end if;

  return v_cat || '-' || v_prod || '-' || v_size || v_color_seg;
end;
$$;

comment on function public.variant_sku_base
  is 'Build the deterministic SKU base {cat}-{prod}-{size}-{color3?} for a variant; shared by gen_variant_sku() and the backfill';

-- -----------------------------------------------------------------------------
-- gen_variant_sku — full SKU builder (trigger path + callable).
-- Ordinal = per-product sequence (existing count + 1); bumped on collision up to
-- 100 attempts, then RAISES (mirrors generateSku's MAX_RETRY_ATTEMPTS).
-- -----------------------------------------------------------------------------
create or replace function public.gen_variant_sku(p_product_id uuid, p_size text, p_color text)
returns text
language plpgsql
as $$
declare
  v_base     text;
  v_ordinal  int;
  v_sku      text;
  v_attempts int := 0;
begin
  v_base := public.variant_sku_base(p_product_id, p_size, p_color);

  -- next 1-based position within this product's variants (the NEW row is not
  -- counted yet because this runs in a BEFORE trigger, before the insert).
  select count(*) + 1 into v_ordinal
  from product_variants
  where product_id = p_product_id;

  v_sku := v_base || '-' || lpad(v_ordinal::text, 3, '0');

  -- collision resolution against existing SKUs (max 100 attempts)
  while exists (select 1 from product_variants where sku = v_sku) loop
    v_attempts := v_attempts + 1;
    if v_attempts > 100 then
      raise exception 'SKU generation exceeded max retry attempts (100) for product %', p_product_id;
    end if;
    v_ordinal := v_ordinal + 1;
    v_sku := v_base || '-' || lpad(v_ordinal::text, 3, '0');
  end loop;

  return v_sku;
end;
$$;

comment on function public.gen_variant_sku
  is 'Generate a deterministic, collision-aware SKU for a variant (DB fallback mirror of shared generateSku)';

-- -----------------------------------------------------------------------------
-- Trigger wrapper: fill NULL sku on insert/update. WHEN (NEW.sku IS NULL) keeps
-- existing SKUs intact on edits (spec scenario 4: edit preserves SKU).
-- -----------------------------------------------------------------------------
create or replace function public.trg_variant_sku_autofill()
returns trigger
language plpgsql
as $$
begin
  if NEW.sku is null then
    NEW.sku := public.gen_variant_sku(NEW.product_id, NEW.size, NEW.color);
  end if;
  return NEW;
end;
$$;

create trigger trg_variant_sku_autofill
  before insert or update on product_variants
  for each row
  when (NEW.sku is null)
  execute function public.trg_variant_sku_autofill();

comment on trigger trg_variant_sku_autofill on product_variants
  is 'Backfills NULL variant SKU via gen_variant_sku() before insert/update';

-- -----------------------------------------------------------------------------
-- One-time backfill for existing NULL skus.
-- Ordinal = ROW_NUMBER() per product (ordered by id) = the per-product sequence a
-- product accrues via sequential gen_variant_sku() inserts. We intentionally do
-- NOT call gen_variant_sku() per row here: a single UPDATE runs in one statement
-- snapshot that cannot see its own in-progress row updates, so the in-function
-- existence check would miss already-filled siblings and emit DUPLICATE SKUs
-- (unique-constraint violation). The CTE assigns distinct, deterministic
-- ordinals from the pre-update state. Re-run is a no-op (no NULL skus left).
-- -----------------------------------------------------------------------------
with numbered as (
  select
    id,
    row_number() over (partition by product_id order by id) as ordinal
  from product_variants
  where sku is null
)
update product_variants as pv
set sku = public.variant_sku_base(pv.product_id, pv.size, pv.color)
        || '-' || lpad(numbered.ordinal::text, 3, '0')
from numbered
where pv.id = numbered.id;
