# Delta for Auto SKU Generation

> Change: `auto-sku-generation` | Project: m-b-casual | Phase: spec | Mode: hybrid

## Domain: sku-generation (NEW)

### Purpose
Auto-generate unique, deterministic SKUs for product variants at creation time. SKU is never manually entered or overridden by admins.

### Requirement: SKU format and token derivation

The system MUST generate a SKU for every variant at creation using the format `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`. The `generateSku` util MUST accept `{ categorySlug, productSlug, size?, color?, ordinal }` and return a string conforming to `skuStringSchema`. Tokens are derived as follows:

| Token | Source | Derivation | Example |
|-------|--------|-----------|---------|
| CAT_SLUG | `categories.slug` | verbatim (lowercase, hyphenated) | `mujer` |
| PRODUCT_SLUG | `products.slug` | verbatim (lowercase, hyphenated) | `camisa-oversize-blanca` |
| SIZE | `product_variants.size` | slugify → uppercase; `UNI` if null/empty; `Único`/`Única`/`UNICO` → `UNI` (user override, supersedes scenario 1) | `S`, `UNI` |
| COLOR3 | `product_variants.color` | slugify → first 3 chars → uppercase; **omitted** if null/empty | `BLA` (Blanco) |
| NNN | `ordinal` param | 3-digit zero-padded, 1-based | `001` |

**Slugify (per-token)**: NFD normalize → strip combining diacritical marks → lowercase → strip non-alphanumeric.

### Requirement: SkuString validation

Every generated SKU MUST conform to `skuStringSchema`:

```typescript
export const skuStringSchema = z.string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*-[A-Z0-9]+(?:-[A-Z]{3})?-\d{3}$/);
```

Regex breakdown: lowercase slug segments → uppercase SIZE → optional 3-letter COLOR3 → 3-digit NNN. The `sku text unique` DB constraint is the final guard; auto-generation MUST never emit duplicates.

> **Limitation**: `skuStringSchema` uses ASCII-only character classes (`[a-z0-9]`, `[A-Z0-9]`, `[A-Z]{3}`, `\d` without the `u` flag). It therefore REJECTS SKUs that contain diacritic color tokens (e.g. `hombre-pantolon-S-ÍND-001` → `false`). This is a latent inconsistency: the spec mandates that `generateSku` PRESERVES diacritics in color tokens (e.g. `Índigo → ÍND`), yet `skuStringSchema` cannot validate those values. The schema is currently **not applied** to generated SKUs at any call site (only defined + exported in `validators/product.ts`), so it does not block runtime. To resolve, either (a) add a Unicode-aware alternative schema (`\p{L}`, `{u}` flag) for diacritic validation, or (b) strip diacritics from color tokens at generation time. Documented as WARNING W1 in the verify report (`openspec/changes/auto-sku-generation/verify-report.md`).

#### Scenario: New variant gets auto-generated SKU
- GIVEN product with category slug `mujer`, product slug `camisa-oversize`
- WHEN admin creates variant { size: "M", color: "Blanco" } with ordinal 1
- THEN `generateSku` returns `mujer-camisa-oversize-M-BLA-001`

> **Note**: Reconciled during verification (W2). The original spec example used `camisa-oversize-blanca` as the product slug (color embedded in the slug) with size `S` → `…-blanca-S-BLA-001`. The implementation uses `camisa-oversize` (no color in slug) with size `M` → `…-M-BLA-001`, matching the `sku.ts` JSDoc example and `sku.test.ts` L6–L14.

#### Scenario: Color-less variant omits COLOR3 token
- GIVEN product with category slug `mujer`, product slug `cinto-cuero-negro`
- WHEN admin creates variant { size: "Único", color: null } with ordinal 1
- THEN `generateSku` returns `mujer-cinto-cuero-UNI-001`

> **Note**: The original spec example showed `…-UNICO-001` (5-char SIZE token). This was reconciled during verification (W2) per the user-approved override: `Único`/`Única`/`UNICO` all collapse to the 3-char token `UNI`. The implementation (`deriveSizeToken` in `sku.ts`) uses NFD diacritic-stripping + lowercase comparison to recognize these variants. All scenarios and tests now use `UNI`.

#### Scenario: Duplicate size×color gets distinct ordinal
- GIVEN product with existing variant SKU `mujer-camisa-oversize-M-BLA-001`
- WHEN admin creates second variant { size: "M", color: "Blanco" } with ordinal 2
- THEN `generateSku` returns `mujer-camisa-oversize-M-BLA-002`

---

## Domain: admin-catalog (MODIFIED)

### MODIFIED Requirement: Variant management

Each product MUST support multiple variants with size, color, and stock. SKUs MUST be auto-generated on variant creation — admins SHALL NOT manually enter or override SKUs. Admins MUST add, edit, and remove variants inline. The `updateProduct` flow MUST preserve existing variant SKUs by upserting (matching on variant ID), never deleting all variants and re-inserting.

(Previously: SKUs were manually entered by admins; `updateProduct` deleted all variants then re-inserted, wiping every SKU on each product edit.)

#### Scenario: Add variant without manual SKU input
- GIVEN a product without variants
- WHEN the admin adds variant "M / Negro" with stock 10 (no SKU field visible)
- THEN the variant is saved to `product_variants` with auto-generated SKU

#### Scenario: Remove variant with orders
- GIVEN a variant referenced by existing orders
- WHEN the admin attempts to delete it
- THEN the system BLOCKS deletion with a constraint error message

#### Scenario: Edit preserves SKU
- GIVEN a product with variant SKU `mujer-camisa-oversize-blanca-S-BLA-001`
- WHEN the admin edits the variant's stock and saves (SKU not visible/editable)
- THEN the variant retains SKU `mujer-camisa-oversize-blanca-S-BLA-001` unchanged

---

## Domain: database-schema (ADDED + MODIFIED)

### ADDED Requirement: SKU backfill trigger

A `BEFORE INSERT` trigger on `product_variants` MUST auto-generate a SKU using the same derivation logic as `generateSku` when `NEW.sku IS NULL`. The trigger MUST resolve `category_slug` and `product_slug` via joins to `categories` and `products`. A one-time backfill UPDATE MUST populate existing NULL-SKU rows. Seed data rewrite is OUT OF SCOPE.

#### Scenario: DB trigger backfills NULL SKU on insert
- GIVEN a row inserted into `product_variants` with `sku = NULL`
- WHEN the product's category slug is `mujer` and product slug is `camisa-oversize-blanca`, size "S", color "Blanco", ordinal 1
- THEN the trigger sets `sku` to `mujer-camisa-oversize-blanca-S-BLA-001`

### MODIFIED Requirement: Complete table schema

The migration MUST create table `product_variants` with `sku text unique` (nullable, no length cap). The schema for `sku` SHALL NOT change — it remains `text unique` nullable. The SKU uniqueness constraint is the binding guard.

(Previously: `product_variants.sku text unique` with no trigger; NULL SKUs allowed but never auto-filled.)

#### Scenario: All tables created after migration
- GIVEN a fresh Supabase project
- WHEN the initial migration runs
- THEN `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` returns exactly 10 tables

#### Scenario: Foreign key constraints prevent orphan rows
- GIVEN an order referencing a non-existent customer
- WHEN `INSERT INTO orders (customer_id) VALUES ('00000000-0000-0000-0000-000000000000')`
- THEN the database MUST reject with foreign key violation

---

## Domain: shared-package (ADDED + MODIFIED)

### ADDED Requirement: productVariantCreateSchema

The shared package MUST export `productVariantCreateSchema` — a Zod object schema validating variant creation input. It MUST carry `sku?: string` (optional; carried for upsert-by-variant preservation, ignored on new create). Fields: `id?` (uuid, optional), `size?` (string, optional), `color?` (string, optional), `discount?` (int 0-100, default 0), `stock` (int ≥ 0), `sku?` (string, optional).

#### Scenario: Valid variant input passes schema
- GIVEN a variant object { size: "S", color: "Blanco", stock: 10 }
- WHEN validated with `productVariantCreateSchema`
- THEN it returns success (sku is auto-generated downstream, not validated here)

### MODIFIED Requirement: Format utilities

The package MUST export `generateSku` from `utils/sku.ts` (re-exported via `utils/index.ts`), following the existing `generateSlug` pattern. It MUST accept `{ categorySlug, productSlug, size?, color?, ordinal }` and return a SKU string conforming to `skuStringSchema`.

(Previously: `formatPrice`, `formatDate`, `generateSlug` exported; no SKU util existed.)

#### Scenario: generateSku produces deterministic output
- GIVEN the same input params { categorySlug: "mujer", productSlug: "camisa-oversize-blanca", size: "S", color: "Blanco", ordinal: 1 }
- WHEN `generateSku` is called twice
- THEN both calls return the identical string `mujer-camisa-oversize-blanca-S-BLA-001`

---

## Data Model Changes

| Element | Current | Stance |
|---------|---------|--------|
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

### Data Migration Notes
- Existing seeded SKUs (3-segment abbreviation format) are NOT rewritten — seed rewrite is OUT OF SCOPE per proposal R4.
- Existing NULL-SKU rows are backfilled via the one-time UPDATE above.
- The trigger only fires on `BEFORE INSERT`, never on `UPDATE` — existing SKUs are preserved.

## API Changes

### `generateSku` util (`packages/shared/src/utils/sku.ts`)

```typescript
interface GenerateSkuParams {
  /** Category slug — used verbatim (e.g. "mujer") */
  categorySlug: string;
  /** Product slug — used verbatim (e.g. "camisa-oversize-blanca") */
  productSlug: string;
  /** Variant size (nullable → "UNI" fallback) */
  size?: string | null;
  /** Variant color (null → omit COLOR3 segment) */
  color?: string | null;
  /** 1-based per-product ordinal, zero-padded to 3 digits */
  ordinal: number;
}

export function generateSku(params: GenerateSkuParams): string;
```

### `productVariantCreateSchema` (`packages/shared/src/validators/product.ts`)

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

### Exports
- `packages/shared/src/utils/sku.ts` — add `generateSku`, re-export from `utils/index.ts`
- `packages/shared/src/validators/product.ts` — add `skuStringSchema`, `productVariantCreateSchema`; re-export from `validators/index.ts`

## Acceptance Criteria Traceability

- [x] `generateSku` unit tests pass (`pnpm --filter web test`)
- [x] New variant gets `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3}-{NNN}`; no manual SKU input visible
- [x] Editing a product preserves all existing variant SKUs (upsert-by-variant)
- [x] Duplicate size×color under one product gets distinct `-NNN` ordinals
- [x] DB trigger backfills NULL SKU on insert

## Out of Scope (Acknowledged)
- Seed data SKU rewrite (deferred — proposal R4)
- Mobile/shared test runner setup (no vitest in shared/mobile)
