# Tasks: Fase 0 — Fundación del Proyecto

## Review Workload Forecast

| Field                   | Value                     |
| ----------------------- | ------------------------- |
| Estimated changed lines | ~980                      |
| 400-line budget risk    | High                      |
| Chained PRs recommended | Yes                       |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy       | ask-on-risk               |
| Chain strategy          | pending                   |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                          | Likely PR | Notes                                    |
| ---- | ------------------------------------------------------------- | --------- | ---------------------------------------- |
| 1    | Monorepo foundation (root configs + packages scaffold)        | PR 1      | Independent, ~130 lines, PR base = main  |
| 2    | Tooling (ESLint + Prettier + README) + shared types/constants | PR 2      | Depends PR 1, ~230 lines, PR base = main |
| 3    | Shared validators (Zod) + utils (formatPrice/Date/slug)       | PR 3      | Depends PR 1, ~260 lines, PR base = main |
| 4    | DB schema + auth trigger + storage policies                   | PR 4      | Depends PR 1, ~280 lines, PR base = main |

## Phase 1: Monorepo Foundation

- [x] 1.1 Create `package.json` root — private, pnpm workspaces, scripts (lint/format/type-check/clean)
- [x] 1.2 Create `pnpm-workspace.yaml` — `packages: ['packages/*']`
- [x] 1.3 Create `tsconfig.base.json` — ESNext, bundler, strict, paths: @mbt/shared
- [x] 1.4 Create `.gitignore` — node_modules, dist, .env, .expo, supabase/.temp
- [x] 1.5 Scaffold `packages/shared/` — `@mbt/shared` package.json + tsconfig.json (composite)
- [x] 1.6 Scaffold `packages/web/` + `packages/mobile/` — package.json + tsconfig.json + src/
- [x] 1.7 Run `pnpm install` — verify workspace resolution across 3 packages ✅ (4 projects resolved)

## Phase 2: Core Implementation

- [x] 2.1 Create `eslint.config.mjs` — flat config with TypeScript plugin
- [x] 2.2 Create `.prettierrc` — semi, singleQuote, trailingComma, printWidth:100
- [x] 2.3 Create `packages/shared/src/types/` — 9 entity interfaces (Product, Category, Order, etc.)
- [x] 2.4 Create `packages/shared/src/validators/` — Zod schemas per entity (positive money, uuid(), enum)
- [x] 2.5 Create `packages/shared/src/constants/` — CATEGORIES, COLORS, SIZES, ORDER_STATUS
- [x] 2.6 Create `packages/shared/src/utils/` — formatPrice(ARS), formatDate, generateSlug
- [x] 2.7 Create `packages/shared/src/index.ts` — re-export all modules
- [x] 2.8 Create `supabase/config.toml` — project config
- [x] 2.9 Create `supabase/migrations/00001_initial.sql` — full schema: extensions, 10 tables, FKs, enums, indexes, monthly_sales/low_stock views, updated_at triggers

## Phase 3: Integration

- [x] 3.1 Add `handle_new_user()` PL/pgSQL function + AFTER INSERT trigger on auth.users
- [x] 3.2 Add RLS policies: products (public SELECT, admin all), orders (own SELECT, admin all), cash_movements (admin only)
- [x] 3.3 Add storage bucket `product-images` (public SELECT, admin INSERT) + `receipts` (admin only)

## Phase 4: Verification

- [ ] 4.1 Run `tsc --noEmit` — zero errors across all packages
- [ ] 4.2 Run `eslint .` — flat config passes on all source
- [ ] 4.3 Run `prettier --check .` — consistent style enforced
- [ ] 4.4 Deploy migration to Supabase project — verify 10 tables, 2 views, indexes, RLS, triggers
- [ ] 4.5 Test auth trigger: INSERT into auth.users → verify customers row auto-created
- [ ] 4.6 Test storage: anonymous SELECT on product-images succeeds, INSERT rejected

## Dependency Graph

```
Phase 1 (Foundation)
  ├── Phase 2 (Core) — tooling + shared + migration
  │     └── Phase 3 (Integration) — auth + storage
  │           └── Phase 4 (Verification)
```

PR 1 delivers Phase 1. PR 2-4 are stackable after Phase 1 completes.
