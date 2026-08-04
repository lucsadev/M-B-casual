# Design: Auto SKU Generation

## Technical Approach

SKUs become 100% auto-generated in a shared TS util `generateSku` (Option B), called by the web + mobile create paths; `updateProduct` is reformed from delete+reinsert to an id-keyed upsert that preserves existing SKUs; the admin SKU inputs are removed; a Postgres `BEFORE INSERT OR UPDATE` trigger backfills NULL SKUs as a defensive fallback. No seed rewrite (R4 deferred).

## Architecture Overview

```
packages/shared/src/utils/sku.ts   ── generateSku (single source of truth)
        │ imports format.generateSlug (format.ts:42)
        ▼
web  use-product-mutations.ts ─┐
mobile use-admin-products.ts  ─┴─ generate + persist via Supabase
    createProduct  → generateSku (new variants)
    updateProduct  → upsert-by-variant (preserve existing sku)
        ▼
supabase product_variants (upsert onConflict:'id')
        ▼
BEFORE INSERT/UPDATE trigger → backfills sku when NULL  (fallback)
```

## Architecture Decisions

| Decision | Options | Choice / Rationale |
|----------|---------|--------------------|
| Generation location | shared util vs per-client vs DB-trigger-only | **Shared TS util** + DB trigger fallback. Utilar en `@mbt/shared` guarantees web/mobile parity (R3); trigger is defense-in-depth, not the primary path (easier to unit-test TS than PL/pgSQL). |
| SKU format | 3-seg abbrev (A) vs full-slug (B) | **Full-slug `{CAT}-{PROD}-{SIZE}-{COLOR3}`** with `-NN` ordinal (B). Self-documenting, no magical abbrev table, unique-by-construction since `products.slug` is globally unique. |
| updateProduct | delete+reinsert / upsert-by-id | **Upsert by variant `id`** with `onConflict: 'id'`, deleting only rows not in the submitted set. Preserves existing SKUs (R1) and keeps FK integrity (`order_items.variant_id`, `purchase_items.variant_id`). |
| Migration strategy | edit 00000 vs new file | **New migration `00002_sku_autofill_trigger.sql`** mirroring the `00001` incremental convention; also reconcile function+trigger into `00000_full_database.sql` (fresh-env) so both dev paths converge. |
| SKU editability | keep manual override | **No manual entry** — SKU block removed from forms. Ordinal `-NNN` resolves duplicates so uniqueness never needs a human. |

## Data Flow (createProduct)

```
form values (size,color,stock,discount, no sku)
  → mutation: fetch category.slug + product.slug
  → for each new variant: sku = generateSku({catSlug,prodSlug,size,color, used})
  → supabase.from('product_variants').insert({...v, product_id, sku})
  → trigger: row already has sku → no-op
```
New product creation: only `createProduct` generates. Duplicate size×color in one batch get distinct `-NNN` ordinals via a shared `used` Set.

## Data Flow (update — upsert-by-variant)

```
submitted variants (carry id when pre-existing, sku preserved)
  → build rows: {id?: string, product_id, size, color, stock, discount, sku}
     - id present  → sku = existing (passed through, unchanged)
     - id absent   → sku = generateSku(...)  (new variant)
  → supabase.from('product_variants')
      .upsert(rows, { onConflict: 'id' })
  → delete orphan rows not in submitted ids:
      .delete().eq('product_id', id).not('id','in', submittedIds)
```
Requires form default values to carry `variant.id`. New (id-less) variants leave `id` undefined → inserts; existing rows upsert with their original SKU intact.

## Interfaces & Contracts

**`generateSku` util** — new `packages/shared/src/utils/sku.ts`:
```ts
export function generateSku(input: {
  categorySlug: string;
  productSlug: string;
  size?: string | null;
  color?: string | null;
  used?: ReadonlySet<string>;      // SKUs already claimed in this batch
}): string;
```
Token derivation:
- `categorySlug` / `productSlug` — lowercased, slugified (reuse `generateSlug`, format.ts:42).
- size → `slugify(size).toUpperCase()`; empty → `UNI`.
- color → `slugify(color).slice(0,3)` empty → `GEN` (free-text noise bounded, R5).
- base = `{cat}-{prod}-{size}-{color3}`; while `used` contains base, append `-{n}` (n=1,2…) and include that ordinal back into `used`.

Trigger (new `00002_sku_autofill_trigger.sql`), Fallback route:
```sql
create or replace function public.autofill_variant_sku()
returns trigger language plpgsql as $$
declare v_cat text; v_prod text; v_base text;
begin
  if new.sku is not null and new.sku <> '' then return new; end if;
  select c.slug, p.slug into v_cat, v_prod
    from products p join categories c on c.id = p.category_id
    where p.id = new.product_id;
  v_base := lower(v_cat) || '-' || lower(v_prod) || '-' ||
            coalesce(upper(nullif(new.size,'')),'UNI') || '-' ||
            coalesce(left(regexp_replace(new.color,'[^a-zA-Z0-9]','','g'),3),'');
  for i in 1..100 loop
    exit when not exists (select 1 from product_variants where sku = v_base);
    v_base := v_base || '-' || i;
  end loop;
  new.sku := v_base; return new;
end $$ security invoker;


create trigger trg_product_variants_autofill_sku
before insert or update of product_id, size, color on product_variants
for each row when ((new.sku is null) or (new.sku = ''))
execute function public.autofill_variant_sku();
```
Placed in the trigger section of `00000_full_database.sql` too, so fresh environments include it.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/utils/sku.ts` | Create | `generateSku` util + token derivation |
| `packages/shared/src/utils/index.ts` | Modify | export `generateSku` |
| `packages/web/src/features/admin/products/api/use-product-mutations.ts` | Modify | generate in createProduct; updateProduct → upsert-by-variant |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | Modify | remove SKU `<Input>` block (lines 80-87); drop `sku` from append; optional read-only label |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` | Modify | drop `sku` from variant schema/defaultValues; add variant `id` pass-through |
| `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | Modify | drop `sku: v.sku` mapping (lines 52-58, 72-78) |
| `packages/web/src/test/utils/sku.test.ts` | Create | unit tests for `generateSku` |
| `packages/mobile/src/features/admin/api/use-admin-products.ts` | Modify | same create/update reform as web |
| `packages/mobile/src/app/(admin)/productos/[id].tsx` | Modify | remove SKU input (line 289-294) + `sku` state/save; drop local `slugify` (line 15) |
| `supabase/migrations/00002_sku_autofill_trigger.sql` | Create | trigger function + trigger |
| `supabase/migrations/00000_full_database.sql` | Modify | add function (functions section) + trigger (triggers section) |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `generateSku` format + fallbacks + ordinal | new `packages/web/src/test/utils/sku.test.ts` (`pnpm --filter web test`) |
| Unit | id-less collisions in a batch | `used` Set across variants in one test |

Trigger verified once via `supabase db advisors` and manual/test DB insert (not automated; no running DB test harness).

## Migration / Rollout

Fresh-env: 00000 now includes trigger. Existing env: apply `00002` (add trigger only; no data rewrites). Rollback: drop trigger, restore form inputs + delete+reinsert from git. New SKUs additive; `sku text unique` stays as guard.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| R1 transpose update wipes SKUs | upsert-by-variant reform (delete only unsubmitted ids) + trigger fallback |
| R2 SKU collisions | unique `products.slug` + `-N` per-batch ordinal + `sku UNIQUE` guard |
| R3 web/mobile divergence | single shared `generateSku`; identical call sites |
| R4 seed format mismatch | deferred (out of scope); no read path depends on format |
| R5 free-text color noise | `generateSlug` + `.slice(0,3)` bound length |

## Dependencies

Confirmed present: `categories.slug`, `products.slug`, `product_variants.size/color`. Test runner: web vitest only (`pnpm --filter web test`). `packages/shared` has no test runner — shared tests run through web's vitest via the `@mbt/shared` alias (`vitest.config.ts:11`).

## Open Questions

- [ ] Does the admin want read-only SKU displayed in the form, or fully hidden? (Design keeps SKU internal; a read-only label is available if desired.)