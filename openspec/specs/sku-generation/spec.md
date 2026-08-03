# SKU Generation Specification

## Purpose

Auto-generate unique, deterministic SKUs for product variants at creation time. SKUs are never manually entered or overridden by admins — they are produced by a shared `generateSku` util in `@mbt/shared` with a Postgres trigger fallback for defense-in-depth.

## SKU Format

```
{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3?}-{NNN}
```

| Token | Source | Derivation | Example |
|-------|--------|-----------|---------|
| `CAT_SLUG` | `categories.slug` | verbatim (lowercase, hyphenated); via `generateSlug` | `mujer` |
| `PRODUCT_SLUG` | `products.slug` | verbatim (lowercase, hyphenated); via `generateSlug` | `camisa-oversize` |
| `SIZE` | `product_variants.size` | slugify → uppercase; `UNI` if null/empty; `Único`/`Única`/`UNICO` → `UNI` (user override) | `S`, `UNI` |
| `COLOR3` | `product_variants.color` | `slugifyToken` → first 3 chars → uppercase; **omitted** if null/empty | `BLA` (Blanco) |
| `NNN` | `ordinal` param | 3-digit zero-padded, 1-based | `001` |

**Slugify (per-token)**: NFD normalize → strip combining diacritical marks → lowercase → strip non-alphanumeric. This is the `generateSlug` function from `format.ts`.

**Token slugify (COLOR3/SIZE)**: Unlike `generateSlug`, the `slugifyToken` helper preserves diacritics via `\p{L}\p{N}` (e.g. `Índigo → índigo → ÍND`) — only diacritic marks are stripped by the NFD pass for `Único`/`Única` recognition.

### Token Derivation Rules

- **CAT_SLUG / PRODUCT_SLUG**: passed through `generateSlug` (idempotent on clean DB slugs). DB slugs are pre-sanitized at creation, so SQL `lower(c.slug)` ≡ TS `generateSlug()` on stored values.
- **SIZE**: `slugifyToken(size).toUpperCase()`. If null/empty → `UNI`. If diacritic-insensitively matches `Único` or `Única` → `UNI` (NFD strip + lowercase compare).
- **COLOR3**: `truncateToken(slugifyToken(color), 3).toUpperCase()`. If null/empty → segment omitted (empty string, no `-COLOR3` segment).
- **NNN**: `ordinal.toString().padStart(3, '0')`. 1-based per-product ordinal.
- **Collision safety**: when multiple variants in one batch share the same base, the caller increments the ordinal. The `used?: ReadonlySet<string>` parameter enables a collision loop (increment ordinal until free); the caller owns the set and must `used.add(sku)` after each generation.

## Requirements

### Requirement: SKU format and token derivation

The system MUST generate a SKU for every variant at creation using the format `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`. The `generateSku` util MUST accept `{ categorySlug, productSlug, size?, color?, ordinal, used? }` and return a string. A `MAX_RETRY_ATTEMPTS` cap of 100 MUST be enforced in both TS and SQL.

#### Scenario: New variant gets auto-generated SKU

- GIVEN product with category slug `mujer`, product slug `camisa-oversize`
- WHEN admin creates variant { size: "M", color: "Blanco" } with ordinal 1
- THEN `generateSku` returns `mujer-camisa-oversize-M-BLA-001`

> **Note**: Reconciled during verification (WARNING W2). The original spec example used `camisa-oversize-blanca` as the product slug (color embedded in the slug) with size `S` → `…-blanca-S-BLA-001`. The implementation uses `camisa-oversize` (no color in slug) with size `M` → `…-M-BLA-001`, matching the `sku.ts` JSDoc example and `sku.test.ts` L6–L14.

#### Scenario: Color-less variant omits COLOR3 token

- GIVEN product with category slug `mujer`, product slug `cinto-cuero-negro`
- WHEN admin creates variant { size: "Único", color: null } with ordinal 1
- THEN `generateSku` returns `mujer-cinto-cuero-UNI-001`

> **Note**: Reconciled during verification (WARNING W2). The original spec example showed `…-UNICO-001` (5-char SIZE token). Per the user-approved override, `Único`/`Única`/`UNICO` all collapse to the 3-char token `UNI`. The implementation (`deriveSizeToken` in `sku.ts`) uses NFD diacritic-stripping + lowercase comparison. All scenarios and tests now use `UNI`.

#### Scenario: Diacritic color token preserved

- GIVEN product with category slug `hombre`, product slug `pantalon`, size "S", color "Índigo", ordinal 1
- WHEN `generateSku` is called
- THEN it returns `hombre-pantalon-S-ÍND-001` (diacritic `Í` preserved in COLOR3)

#### Scenario: Duplicate size×color gets distinct ordinal

- GIVEN product with existing variant SKU `mujer-camisa-oversize-M-BLA-001`
- WHEN admin creates second variant { size: "M", color: "Blanco" } with ordinal 2
- THEN `generateSku` returns `mujer-camisa-oversize-M-BLA-002`

### Requirement: SKU validation schema

Every SKU MUST conform to `skuStringSchema`:

```typescript
export const skuStringSchema = z.string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*-[A-Z0-9]+(?:-[A-Z]{3})?-\d{3}$/);
```

> **Limitation (WARNING W1)**: `skuStringSchema` uses ASCII-only character classes (`[a-z0-9]`, `[A-Z0-9]`, `[A-Z]{3}`, `\d` without the `u` flag). It therefore REJECTS SKUs that contain diacritic color tokens (e.g. `hombre-pantalon-S-ÍND-001` → `false`). This is a latent spec-internal inconsistency: the spec mandates that `generateSku` PRESERVES diacritics in color tokens (`Índigo → ÍND`), yet `skuStringSchema` cannot validate those values. Currently `skuStringSchema` is **not applied** to generated SKUs at any call site (only defined + exported in `validators/product.ts`), so it does not block runtime. To resolve: either (a) add a Unicode-aware alternative schema (`\p{L}`, `{u}` flag), or (b) strip diacritics from color tokens at generation time.

### Requirement: productVariantCreateSchema

The shared package MUST export `productVariantCreateSchema` — a Zod object schema validating variant creation input. Carries `sku?: string` (optional; preserved on upsert-by-variant, ignored on new create). Fields: `id?` (uuid, optional), `size?` (string, optional), `color?` (string, optional), `discount?` (int 0–100, default 0), `stock` (int ≥ 0, default 0), `sku?` (string, optional).

```typescript
export const productVariantCreateSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  discount: z.number().int().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional(),  // carried for upsert preservation; ignored on new create
});
```

## Data Model

| Element | Type | Stance |
|---------|------|--------|
| `product_variants.sku` | `text unique` nullable | UNCHANGED — keep nullable, no length cap |
| `product_variants.size` | `text` nullable | UNCHANGED |
| `product_variants.color` | `text` nullable | UNCHANGED |
| New index | None | NONE — `idx_variants_lookup` already covers `sku` |

## Migration / Data

### Trigger SQL

```sql
-- Helper: format SKU from pre-resolved tokens (shared by trigger + backfill)
create or replace function gen_variant_sku(
  cat_slug text, prod_slug text, sz text, col text, ord int
) returns text language plpgsql as $$
declare
  size_tok text;
  color_tok text;
begin
  if sz is null or trim(sz) = '' then
    size_tok := 'UNI';
  else
    size_tok := upper(regexp_replace(sz, '[^a-zA-Z0-9]', '', 'g'));
  end if;
  if col is not null and trim(col) <> '' then
    color_tok := '-' || upper(left(regexp_replace(lower(col), '[^a-z0-9]', '', 'g'), 3));
  else
    color_tok := '';
  end if;
  return cat_slug || '-' || prod_slug || '-' || size_tok || color_tok
    || '-' || lpad(ord::text, 3, '0');
end;
$$;

-- BEFORE INSERT trigger: backfill NULL sku
create or replace function trg_variant_sku_backfill()
returns trigger as $$
declare
  cat_slug text;
  prod_slug text;
  ord int;
begin
  if NEW.sku is null then
    select c.slug, p.slug
    into cat_slug, prod_slug
    from products p
    join categories c on c.id = p.category_id
    where p.id = NEW.product_id;
    ord := (select coalesce(count(*), 0) + 1
            from product_variants where product_id = NEW.product_id);
    NEW.sku := gen_variant_sku(cat_slug, prod_slug, NEW.size, NEW.color, ord);
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_variant_sku_backfill
  before insert on product_variants
  for each row execute function trg_variant_sku_backfill();

-- One-time backfill for existing NULL-SKU rows (seed rewrite is OUT OF SCOPE)
with numbered as (
  select id,
    row_number() over (partition by product_id order by created_at) as ord
  from product_variants where sku is null
)
update product_variants pv
set sku = gen_variant_sku(c.slug, p.slug, pv.size, pv.color, n.ord)
from numbered n
join products p on p.id = n.product_id
join categories c on c.id = p.category_id
where pv.id = n.id;
```

> **Implementation note**: The production migration (`00002_sku_autofill_trigger.sql`) uses a 3-function split (`variant_sku_base` + `gen_variant_sku` + `trg_variant_sku_autofill`) with `BEFORE INSERT OR UPDATE WHEN (NEW.sku IS NULL)`, a 100-retry collision cap, and Unicode-aware `[[:alnum:]]` character classes. This spec's SQL block is the conceptual contract; the actual migration file is the source of truth. See the [Design](design.md) and [Apply Progress](apply-progress.md) in the archived change folder for the implemented SQL.

### Data Migration Notes

- Existing seeded SKUs (3-segment abbreviation format) are NOT rewritten — seed rewrite is OUT OF SCOPE per proposal R4.
- Existing NULL-SKU rows are backfilled via a one-time `UPDATE` using `ROW_NUMBER()` CTE for deterministic ordinals (NOT a per-row `gen_variant_sku()` call — a single `UPDATE` statement snapshot cannot see its own in-progress writes, which would cause duplicate SKUs).
- The trigger is `BEFORE INSERT OR UPDATE WHEN (NEW.sku IS NULL)` so existing SKUs are preserved on edit (scenario: Edit preserves SKU).
- Migration files: `supabase/migrations/00002_sku_autofill_trigger.sql` (new) + `supabase/migrations/00000_full_database.sql` (reconciled §5.18–5.20, §6.11 for fresh-env parity).

## API Changes

### `generateSku` util (`packages/shared/src/utils/sku.ts`)

```typescript
export interface GenerateSkuParams {
  /** Category slug — used verbatim (e.g. "mujer") */
  categorySlug: string;
  /** Product slug — used verbatim (e.g. "camisa-oversize") */
  productSlug: string;
  /** Variant size (null / empty / "Único" => "UNI" fallback) */
  size?: string | null;
  /** Variant color (null / empty => omit the COLOR3 segment) */
  color?: string | null;
  /** 1-based per-product ordinal, zero-padded to 3 digits */
  ordinal: number;
  /** SKUs already claimed within the current batch (collision avoidance) */
  used?: ReadonlySet<string>;
}

export function generateSku(params: GenerateSkuParams): string;
export const MAX_RETRY_ATTEMPTS = 100;
```

Exports: `generateSku`, `slugifyToken`, `truncateToken`, `MAX_RETRY_ATTEMPTS` via `utils/index.ts`.
`skuStringSchema`, `productVariantCreateSchema` via `validators/index.ts`.

## Acceptance Criteria Traceability

- [x] `generateSku` unit tests pass (`pnpm --filter web test`) — 32/32
- [x] New variant gets `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`; no manual SKU input visible in admin forms
- [x] Editing a product preserves all existing variant SKUs (upsert-by-variant)
- [x] Duplicate size×color under one product gets distinct `-NNN` ordinals
- [x] DB trigger backfills NULL SKU on insert
- [x] TS ↔ SQL SKU generation parity (identical output for all test inputs)
- [x] Type-check clean across web, shared, and mobile (exit 0)

## Out of Scope (Acknowledged)

- Seed data SKU rewrite (deferred — proposal R4)
- Mobile/shared test runner setup (no vitest in shared/mobile)
