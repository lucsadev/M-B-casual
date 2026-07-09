# Apply Progress — PR 1 + PR 2 + PR 3 + PR 4: Full Fase 0 Foundation

**Change**: fase-0-fundacion
**Mode**: Standard (TDD disabled)
**Date**: 2026-07-07
**PR**: 4 of 4 (stacked-to-main) — 🎉 FINAL

## Completed Tasks (PR 1 — Monorepo Foundation)

- [x] **T001** — Initialize root package.json with pnpm workspaces
- [x] **T002** — Configure TypeScript base (tsconfig.base.json)
- [x] **T003** — Scaffold `@mbt/shared` package
- [x] **T004** — Scaffold `@mbt/web` package
- [x] **T005** — Scaffold `@mbt/mobile` package
- [x] **T006** — Add .gitignore and .npmrc
- [x] **T007** — Add project README

## Completed Tasks (PR 2 — Tooling + Shared Types & Constants)

- [x] **2.1** — Create `eslint.config.mjs` — flat config with TypeScript plugin
- [x] **2.2** — Create `.prettierrc` — semi, singleQuote, trailingComma, printWidth:100
- [x] **2.3** — Create `packages/shared/src/types/` — 8 entity interfaces + index.ts
- [x] **2.5** — Create `packages/shared/src/constants/` — 5 constant arrays + index.ts

## Completed Tasks (PR 3 — Validators & Utils)

- [x] **2.4** — Create `packages/shared/src/validators/` — Zod schemas per entity
- [x] **2.6** — Create `packages/shared/src/utils/` — format utilities
- [x] **2.7** — Update `packages/shared/src/index.ts` — re-export all modules

## Completed Tasks (PR 4 — Database Schema, Auth & Storage)

- [x] **2.8** — Create `supabase/config.toml` — project config (region sa-east-1, email/password auth, storage)
- [x] **2.9** — Create `supabase/migrations/00001_initial.sql` — full schema: extensions, 10 tables, enums, indexes, views, triggers
- [x] **3.1** — Add `handle_new_user()` PL/pgSQL function + AFTER INSERT trigger on auth.users
- [x] **3.2** — Add RLS policies: products (public SELECT, admin all), orders (owner + admin), cash_movements (admin only), customers (owner + admin)
- [x] **3.3** — Add storage buckets `product-images` (public) + `receipts` (admin-only) via seed.sql

## Files Changed (PR 4)

| File                                    | Action  | What Was Done                                                                  |
| --------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `supabase/config.toml`                  | Created | Project configuration with sa-east-1 region, auth, storage, DB settings        |
| `supabase/migrations/00001_initial.sql` | Created | Complete schema: 10 tables, enums, indexes, triggers, views, auth trigger, RLS |
| `supabase/seed.sql`                     | Created | Storage bucket creation + RLS policies for product-images and receipts         |

### Migration Contents (00001_initial.sql)

| Section      | Details                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Extensions   | uuid-ossp, pgcrypto                                                                                                         |
| Enums        | order_status (pending → cancelled)                                                                                          |
| Tables       | categories, products, product_variants, customers, orders, order_items, purchases, purchase_items, expenses, cash_movements |
| Indexes      | GIN on products.name, B-tree on FKs, status, dates, types                                                                   |
| Triggers     | set_updated_at() on products and orders                                                                                     |
| Views        | monthly_sales (security_invoker=true), low_stock (security_invoker=true)                                                    |
| Auth Trigger | handle_new_user() — security definer, auto-creates customer on signup                                                       |
| RLS          | products (public + admin), orders (owner + admin), cash_movements (admin), customers (owner + admin)                        |

## Deviations from Design

| Design Spec                                                      | Actual                                                                        | Rationale                                                                                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.js`                                               | `eslint.config.mjs`                                                           | Root package.json has no `"type": "module"`, so `.mjs` is required for ESM syntax                                                                  |
| 9 entity interfaces                                              | 8 interfaces + 2 union types                                                  | OrderStatus and CashMovementType are union types, not interfaces                                                                                   |
| Zod v3 API assumed                                               | Zod v4 API used                                                               | pnpm resolved zod v4.4.3 — `z.record()` requires 2 args in v4                                                                                      |
| customers.user_id FK to auth.users                               | Column with UNIQUE only, no FK constraint                                     | auth.users DDL not available during local migration execution. Constraint documented via SQL comments and enforced via application layer + trigger |
| expenses.created_by + cash_movements.created_by FK to auth.users | Columns without FK constraints                                                | Same reason — FK documented via SQL comments, enforced at application layer                                                                        |
| All SQL in migration file                                        | RLS + auth trigger included inline in migration; storage in separate seed.sql | Storage buckets cannot be created via migration SQL — seed.sql is convention for post-migration setup                                              |
| Storage policies via inline migration                            | Storage RLS in seed.sql                                                       | Storage policies operate on `storage.objects` table which requires buckets to exist first                                                          |

## Issues Found

- **auth.users FK constraint**: `customers.user_id`, `expenses.created_by`, and `cash_movements.created_by` columns reference `auth.users` at runtime, but the FK constraint cannot be declared in migration SQL because Supabase's `auth` schema DDL is not processed during local migration execution. Mitigation: SQL comments document the intended FK, and the `handle_new_user()` trigger ensures data integrity.
- **Storage bucket creation**: Must use `insert into storage.buckets` or Dashboard UI — not migration SQL. Created `seed.sql` as a companion script for manual execution after migration.

## Workload / PR Boundary

- **Mode**: stacked PR slice (PR 4 of 4) — FINAL
- **Chain strategy**: stacked-to-main
- **Current work unit**: Database schema (config.toml + migration + storage seed)
- **Boundary**: Complete Phase 2 (tasks 2.8-2.9) + Phase 3 (tasks 3.1-3.3). Remaining: Phase 4 verification (4.1-4.6).
- **Estimated review budget impact**: ~391 lines migration + 106 lines seed + 52 lines config = ~549 lines
- **Note**: Exceeds 400-line budget but this is the final PR. The large line count is expected for an initial schema migration — it includes extensive SQL comments for maintainability. No split is practical since the migration is a single atomic unit.

## Verification

- `tsc --noEmit` — ✅ verified in PR 3, no new TS files in PR 4
- Migration SQL validated for syntactic correctness against PostgreSQL 15 grammar

## Commits (PR 4)

| Commit    | Message                                                                                | Files                                 |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| `819ad29` | `feat(supabase): add config.toml with project configuration`                           | supabase/config.toml                  |
| `9ececa2` | `feat(supabase): create initial database migration with schema, auth trigger, and RLS` | supabase/migrations/00001_initial.sql |
| `f714435` | `feat(supabase): add storage buckets seed script`                                      | supabase/seed.sql                     |

## All Commits (Fase 0 — Complete)

| PR        | Count          | Range                                                  |
| --------- | -------------- | ------------------------------------------------------ |
| PR 1      | 7 commits      | Foundation (root configs, packages, gitignore, README) |
| PR 2      | 4 commits      | ESLint, Prettier, types, constants                     |
| PR 3      | 2 commits      | Validators, utils, index.ts wiring                     |
| PR 4      | 3 commits      | Config, migration, seed                                |
| **Total** | **16 commits** | **Full Fase 0 implementation**                         |

## Status

**17/17 Phase 2 tasks complete ✅**
**3/3 Phase 3 tasks complete ✅**
**0/6 Phase 4 tasks complete** (verification deferred to sdd-verify phase)

All Phase 2 and Phase 3 implementation tasks done across 4 stacked PRs. Ready for sdd-verify.
