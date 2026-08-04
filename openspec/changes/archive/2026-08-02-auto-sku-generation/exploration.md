# SDD Exploration — Auto SKU Generation

> Change: `auto-sku-generation` | Project: m-b-casual | Phase: explore | Mode: hybrid

## Current State

SKUs are **100% manually entered** by admins on both web and mobile. There is **no auto-generation
logic anywhere** in the codebase (grep for `generateSku` / `generate_sku` / `sku-utils` returns
nothing).

### Database schema — `product_variants`
Source: `supabase/migrations/00000_full_database.sql`

- `product_variants` (lines 88-97):
  - `id uuid pk`
  - `product_id uuid not null references products(id) on delete cascade`
  - `size text` (nullable)
  - `color text` (nullable)
  - `stock int not null default 0`
  - **`sku text unique`** (line 94) — nullable (NO `NOT NULL`), NO length cap (`text` is
    unbounded in Postgres; only ~1GB practical). Comment (line 100): "Internal stock-keeping
    unit code".
  - `discount int not null default 0`
- Index (line 334): `idx_variants_lookup on product_variants (product_id) include (size, color, stock, sku)`.
- FK holders of `variant_id`:
  - `order_items.variant_id uuid references product_variants(id)` (line 161) — **nullable**.
  - `purchase_items.variant_id uuid references product_variants(id)` (line 191) — **nullable**.

### Attributes available at variant creation time
- `categories.slug` (text, unique) — e.g. `mujer`, `hombre`, `accesorios`.
- `products.slug` (text, unique) — e.g. `camisa-oversize-blanca`.
- `product_variants.size` (text, nullable) — e.g. `S`, `M`, `L`, `XL`, `Único`.
- `product_variants.color` (text, nullable) — e.g. `Blanco`, `Negro`.

### Shared layer — types & validators
Source: `packages/shared/src/`

- `types/product.ts:54` — `ProductVariant.sku?: string` (optional).
- `validators/product.ts:46` — `sku: z.string().optional()`.
- **No `productVariantCreateSchema`** exists. `productCreateSchema` (lines 26-35) only covers the
  `products` row; the `variants` array is shaped by an inline `CreateProductInput` interface inside
  each package's mutation file (not shared/validat​ed).
- `utils/format.ts:42` — `generateSlug(text)` exists (lowercase, hyphen-separated).
- `utils/variants.ts` — stock/size/color resolvers only; **no SKU logic**.
- `utils/index.ts` — exports `format`, `pagination`, `variants` utils. **No SKU util exported.**
- `constants/sizes.ts` — canonical sizes `S, M, L, XL, XXL, Único`.
- `constants/colors.ts` — only 4 brand colors; `color` on a variant is free-text.

### Admin write path (web + mobile) — the critical issue
- `packages/web/src/features/admin/products/api/use-product-mutations.ts`
  - `UpdateProductInput.variants[].sku?: string | null` (line 112).
  - `updateProduct` (line 116): **DELETE all variants** (`.delete().eq('product_id', id)`,
    lines 126-129) then **re-INSERT** the new variant array (lines 133-148). SKU is passed as
    `v.sku ?? null` (line 139). Therefore **every product edit wipes existing SKUs**, even when the
    user only changed the product name/price and never touched the variant SKUs.
  - `createProduct` (line 48): inserts variants with `{ ...v, product_id }` — passes `v.sku`
    straight through; no generation.
- `packages/mobile/src/features/admin/api/use-admin-products.ts`
  - Identical delete + re-insert pattern (lines 183-204); `sku: v.sku ?? null` (line 196).
  - Mobile screen `packages/mobile/src/app/(admin)/productos/[id].tsx` loads existing
    `v.sku ?? ''` into a manual `TextInput` (line 77/290) and saves `v.sku || null` (line 103).
    Has a local `slugify` helper (line 15) — reusable pattern.

### Admin UI
- Web `VariantManager.tsx:80-87` — manual SKU `<Input>` with placeholder `MBT-001` (diverges from
  seed format) and default `sku: ''` on append (line 112).
- `ProductFormPage.tsx:57,77` — maps `sku: v.sku || null` for both create and update.

### SKU usage at read time (consumption — read-only, never a lookup key)
- Web orders `use-order-queries.ts:137` — selects
  `product_variants(size, color, sku)`, maps `sku: item.product_variants?.sku ?? null` (line 158).
- Mobile orders `use-admin-orders.ts:155` — same; `sku: item.product_variants.sku ?? null` (167).
- Catalog `queries.ts` (web `:87`, mobile `:108`) — `mapVariant` sets
  `sku: row.sku ?? undefined`; surfaced on product detail, never a query key.
- `stock-check` edge function (`supabase/functions/stock-check/index.ts`) — selects `sku`,
  returns it in `StockAlert.sku: string | null`. Read-only surfacing to admin.
- **Conclusion**: nothing in the codebase resolves a variant/order by SKU. SKU is display-only
  downstream. The only hard constraint is the DB `unique` index.

### Seed data — existing SKU pattern
Source: `supabase/seed-catalog.sql` (lines 163-217)

Format observed: **`{CAT_ABBR}-{PROD_ABBR}-{SIZE}`** with 3-letter uppercase abbreviations and an
uppercase size token. Color is **NOT** included.

| SKU            | Category | Product               | Size   |
|----------------|----------|-----------------------|--------|
| `CAM-OVS-S/M/L`| Camisa Oversize | camisa-oversize-blanca | S/M/L |
| `VES-MID-*`    | Vestido Midax | vestido-midax-negro    | S/M/L |
| `BLA-BEI-*`    | Blazer Beige | blazer-beige          | S/M/L |
| `REM-BAS-*, -XL`| Remón Básico | remon-basico-algodon | S..XL |
| `POL-TAB-*`    | Pollera Tabla | pollera-tabla-marfil | S/M |
| `CAM-SLI-*`    | Camisa Slim Fit | camisa-slim-fit-celeste | S/M/L |
| `CHO-LAC-*`    | Chomba Lacoste | chomba-lacoste-blanca | M/L/XL |
| `JEA-REC-*`    | Jean Recto | jean-recto-clasico | S/M/L/XL |
| `CIN-CUE-UNI`  | Cinto Cuero | cinto-cuero-negro | Único |
| `CAR-BAN-UNI`  | Cartera Bandolera | cartera-bandolera-marron | Único |

No NN counter and no color segment exist in seed data; uniqueness is achieved purely from the
(product-scoped) size token.

## Affected Areas
- `supabase/migrations/00000_full_database.sql:94` — `sku text unique` constraint (the only real guard).
- `packages/web/src/features/admin/products/api/use-product-mutations.ts:116-151` — **updateProduct delete+reinsert wipes SKUs** (must be reformed or SKU must be regenerated server-side).
- `packages/web/src/features/admin/products/components/VariantManager.tsx:80-87` — manual SKU input.
- `packages/web/src/features/admin/products/pages/ProductFormPage.tsx:52-59` — sku pass-through.
- `packages/mobile/src/features/admin/api/use-admin-products.ts:183-204` — mobile delete+reinsert (same flaw).
- `packages/mobile/src/app/(admin)/productos/[id].tsx:77,103` — mobile SKU input/save.
- `packages/shared/src/validators/product.ts:46` / `types/product.ts:54` — `sku?: string`.
- `packages/shared/src/utils/` — location to **add** a new `sku.ts` util (no existing SKU util).
- `packages/web/src/features/admin/orders/api/use-order-queries.ts:137` — SKU read in order detail.
- `packages/mobile/src/features/admin/api/use-admin-orders.ts:155` — SKU read in order detail.
- `packages/{web,mobile}/src/features/catalog/api/queries.ts:87,108` — SKU read in catalog.
- `supabase/functions/stock-check/index.ts` — SKU read in stock alerts.
- `supabase/seed-catalog.sql:163-217` — establishes the 3-segment convention to align with.

## Key Findings
1. **Schema**: `sku text unique` is nullable, no length cap. Only the `UNIQUE` constraint enforces
   non-collision — auto-gen MUST never emit duplicates across all variants.
2. **Attributes for deterministic SKU**: category.slug, product.slug, size, color are all available
   at insert time — enough to build a deterministic, human-readable SKU.
3. **No SKU util exists** in `packages/shared/src/utils/` — must be created (e.g.
   `utils/sku.ts` exporting `generateSku({ categorySlug, productSlug, size, color, ... })`).
4. **No `productVariantCreateSchema`** exists — the variants array is typed inline per-package.
   Auto-gen logic should be centralized in shared to avoid divergence (web vs mobile).
5. **Seed convention is 3-segment** `{CAT_ABBR}-{PROD_ABBR}-{SIZE}` (abbreviations, no color, no
   counter). A new full-slug format would **break consistency** with existing seeded data.

## Approaches

### Option A — Align with existing seed convention (3-segment, abbreviation-based)
`{CAT_ABBR}-{PROD_ABBR}-{SIZE}[-{COLOR3}]` where abbreviations are derived (first 3 uppercase word
letters of the slug) with a per-product collision fallback.

- Pros: Matches existing seed data exactly → no migration/seed rewrite; short & scannable; matches
  admin expectation.
- Cons: Abbreviation derivation is heuristic and can collide (two products `Camisa Oversize` vs
  `Camisa Slim Fit` both → `CAM`); color segment adds a 4th optional part the seed doesn't use;
  need a collision-resolver (ordinal suffix). Abbreviation table is manual/magical.
- Effort: Medium (abbreviation util + collision handling + update-flow reform).

### Option B — Full-slug deterministic with unique fallback (recommended for robustness)
`{CAT_SLUG}-{PROD_SLUG}-{SIZE}-{COLOR3}` and, when that collides, append `-NN`. Generate in a
shared `generateSku` util; call it in the mutation layer when the admin-supplied `sku` is empty/null.

- Pros: Self-documenting (full slugs readable); deterministic; no abbreviation table; handles
  multi-color + duplicate size×color naturally via the NN fallback; SKU uniqueness guaranteed by
  construction (collision check against DB).
- Cons: Longer SKUs (e.g. `mujer-camisa-oversize-blanca-s-blanco-1`); diverges from the existing
  3-segment seed data (seeded SKUs would remain short while new ones are long — inconsistent
  visual style); needs DB round-trip to detect collisions for the NN fallback.
- Effort: Medium (sku util + shared schema + mutation wiring on BOTH web and mobile + update-flow
  reform so existing SKUs are preserved).

### Option C — Server-side generation (Postgres function / trigger)
Compute the SKU in a `BEFORE INSERT` trigger or an RPC, so web/mobile never set it.

- Pros: Single source of truth; client logic stays dumb; works for any future client.
- Cons: Harder to preview SKU in the UI before save (would need a dry-run RPC); trigger logic is
  harder to test than a TS util; the current JS-only mutations would need refactor. Bigger lift.
- Effort: High.

## Recommendation
**Option B** — a shared TS `generateSku` util in `packages/shared/src/utils/sku.ts` invoked by
the mutation layer when the admin left SKU blank, **combined** with reforming `updateProduct`
(delete+reinsert → upsert-by-variant) so existing SKUs are preserved. Rationale:
- Shared util guarantees web + mobile generate identical SKUs (right now the two admin stacks are
  fully duplicated and diverge easily — see the duplicated delete+reinsert).
- Centralizing in `shared` matches the existing `utils/index.ts` pattern and is the only place both
  clients import from.
- The `unique` constraint is the binding risk; the util must be collision-safe (NN fallback) and
  the update flow must stop discarding SKUs on every edit.

Open questions to take into proposal/spec:
- Do we keep SKUs editable (admin override) — YES (manual entry must still win when provided).
- Migration strategy for existing `null` SKUs and seeded `CAM-OVS-S`-style SKUs.
- Whether to backfill existing `null`-SKU variants with generated values (data migration task).

## Risks
- **R1 (high)**: `updateProduct` on web (`:116`) and mobile (`:183`) **deletes all variants then
  re-inserts** — any auto-generated SKU is lost on the next product edit unless the flow is changed
  to preserve/match existing variants. This must be fixed in tandem with SKU generation.
- **R2 (medium)**: `sku text unique` — no length limit, so format must be collision-safe; a naive
  `{CAT}-{PROD}-{SIZE}` will collide the moment two products share a category+product+size (e.g.
  re-orderings, or `Único` accessories) — need a per-product ordinal fallback.
- **R3 (medium)**: No `productVariantCreateSchema` / per-variant validator — auto-gen logic could
  diverge between web and mobile if not centralized in `@mbt/shared`.
- **R4 (low)**: Seed SKUs use 3-segment abbreviations; new full-slug SKUs will visually mismatch
  seeded rows unless a migration rewrites seeds or a compatibility layer is kept.
- **R5 (low)**: Color is free-text, not constrained to the 4 `COLORS` constants (`colors.ts:10`) —
  color-derived SKU segments can be noisy/arbitrary; should slugify+truncate to a 3-char token.

## Ready for Proposal
**Yes** — the codebase is well-understood. Proposal/spec should define:
- The exact SKU format string and token derivation rules.
- Generation trigger: "in `shared` util, called when admin SKU is blank/null at create AND
  preserved (not wiped) at update."
- Schema decision: keep `sku text unique` nullable (no `NOT NULL`); optionally add a generated
  column comment / migration to backfill existing rows.
- The `updateProduct` flow reform (upsert instead of delete+reinsert) as a bundled task.
- Shared `productVariantCreateSchema` (or inline shape) to carry `sku?: string`.

## Topic Keys / Artifacts Saved
- Engram: `sdd/auto-sku-generation/explore` (topic_key)
- OpenSpec: `openspec/changes/auto-sku-generation/exploration.md`
