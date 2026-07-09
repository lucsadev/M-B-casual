# Design: Fase 0 — Fundación del Proyecto

## Technical Approach

Greenfield monorepo foundation with 6 capabilities built in strict dependency order. Three parallel tracks after monorepo setup: (1) **language infrastructure** (TypeScript base config + ESLint + Prettier), (2) **shared code** (`@mbt/shared` with types, Zod, constants, utils), and (3) **Supabase pipeline** (migration → auth → storage). No consumer code exists yet — every decision prioritizes future-proofing the schema and toolchain.

## Architecture Decisions

| Decision          | Options                                              | Trade-offs                                                                                                                                                        | Choice                                                            |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Monorepo tool     | pnpm ws / Turborepo / Nx                             | Turborepo adds pipeline orchestration but overkill for 3 packages. pnpm ws is zero-config, sufficient.                                                            | **pnpm workspaces**                                               |
| Shared build      | tsc / tsup / tsx                                     | tsup bundles but adds build complexity. tsx is runtime-only. `tsc` with `composite: true` gives full type checking and works with project references.             | **tsc + project references**                                      |
| Shared resolution | workspace protocol / npm publish / tsconfig paths    | Publishing `@mbt/shared` to npm is heavy. tsconfig paths don't work at runtime without ts-node. `workspace:*` is pnpm-native and resolves both types and runtime. | **workspace protocol** (`"@mbt/shared": "workspace:*"`)           |
| Migration source  | Supabase CLI / Dashboard SQL                         | Dashboard lacks version control and diff tracking. Supabase CLI with local `migrations/` dir gives Git-tracked, reproducible schema.                              | **Supabase CLI local migrations**                                 |
| RLS location      | In migration / Separate files                        | Separation is cleaner long-term, but Fase 0 has few policies and they're tightly coupled to table DDL. Single file reduces migration complexity.                  | **Inline in initial migration**                                   |
| Auth trigger      | PL/pgSQL function / Edge Function / Application code | Edge Function adds HTTP overhead. App code breaks on any auth client. PL/pgSQL trigger is transactional, zero-latency, guaranteed.                                | **PL/pgSQL trigger on `auth.users`**                              |
| Storage structure | `products/{id}/file` / Flat                          | Flat breaks at scale (Supabase Storage limits per-folder). By-product folders keep paths predictable and RLS scoped.                                              | **`products/{productId}/{file}` + `receipts/{expenseId}/{file}`** |

## Dependency & Build Order

```
Phase 1                    Phase 2                          Phase 3
─────────                  ──────────                       ──────────
monorepo-setup ─┬──────→ shared-package
                ├──────→ tooling-base
                └──╥──→ database-schema ──→ supabase-auth ──→ supabase-storage
                   ║
              (parallel safe in phase 2)
```

## Module Structure

```
m&b/
├── pnpm-workspace.yaml
├── package.json                  # private: true, scripts: lint/format/typecheck/clean
├── tsconfig.base.json            # target: ES2022, module: NodeNext, strict, paths: @mbt/*
├── .prettierrc                   # semi, singleQuote, trailingComma, printWidth:100
├── eslint.config.js              # Flat config, TypeScript plugin
├── .gitignore                    # node_modules, dist, .env, .expo, supabase/.temp
├── README.md
│
├── packages/
│   ├── shared/
│   │   ├── package.json          # @mbt/shared, exports map
│   │   ├── tsconfig.json         # extends ../tsconfig.base.json, composite, outDir: dist
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/            # Product, Category, Order, Customer, etc.
│   │       ├── validators/       # Zod schemas per entity
│   │       ├── constants/        # CATEGORIES, COLORS, SIZES, ORDER_STATUS
│   │       └── utils/            # formatPrice, formatDate, generateSlug
│   ├── web/
│   │   ├── package.json          # @mbt/web
│   │   ├── tsconfig.json
│   │   └── src/                  # empty scaffold
│   └── mobile/
│       ├── package.json          # @mbt/mobile
│       ├── tsconfig.json
│       └── src/                  # empty scaffold
│
└── supabase/
    ├── config.toml
    └── migrations/
        └── 00001_initial.sql     # 10 tables + views + indexes + triggers + RLS + storage
```

## Key Configurations

**Root package.json** — `"scripts": { "lint": "eslint .", "format": "prettier --write .", "type-check": "tsc --noEmit -p tsconfig.base.json", "clean": "rimraf packages/*/dist" }`

**tsconfig.base.json** — `{ "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "strict": true, "declaration": true, "declarationMap": true, "composite": true, "paths": { "@mbt/shared": ["./packages/shared/src"], "@mbt/web": ["./packages/web/src"], "@mbt/mobile": ["./packages/mobile/src"] } } }`

**Migration file** — single `00001_initial.sql` containing: extensions (uuid-ossp, pgcrypto), all 10 tables with FKs, enum `order_status`, indexes on `products.name/slug`, `orders.customer_id`, `products.category_id`, `monthly_sales` and `low_stock` views, `updated_at` trigger function + triggers on products/orders, `handle_new_user()` function + trigger on auth.users, RLS policies for products/orders/cash_movements, storage bucket `product-images` (public SELECT, admin INSERT).

## File Manifest

| File                                    | Action | Description                           |
| --------------------------------------- | ------ | ------------------------------------- |
| `package.json`                          | Create | Root workspace config                 |
| `pnpm-workspace.yaml`                   | Create | `packages: ['packages/*']`            |
| `tsconfig.base.json`                    | Create | Shared TS compiler options            |
| `eslint.config.js`                      | Create | Flat config with TS rules             |
| `.prettierrc`                           | Create | Formatting standards                  |
| `.gitignore`                            | Create | Ignore patterns                       |
| `README.md`                             | Create | Project setup                         |
| `packages/shared/package.json`          | Create | `@mbt/shared` workspace package       |
| `packages/shared/tsconfig.json`         | Create | Extends base, composite               |
| `packages/shared/src/index.ts`          | Create | Package entry + re-exports            |
| `packages/shared/src/types/*.ts`        | Create | 9 entity interfaces                   |
| `packages/shared/src/validators/*.ts`   | Create | Zod schemas per entity                |
| `packages/shared/src/constants/*.ts`    | Create | CATEGORIES, COLORS, SIZES, etc.       |
| `packages/shared/src/utils/*.ts`        | Create | formatPrice, formatDate, generateSlug |
| `packages/web/package.json`             | Create | `@mbt/web` scaffold                   |
| `packages/web/tsconfig.json`            | Create | Extends base                          |
| `packages/mobile/package.json`          | Create | `@mbt/mobile` scaffold                |
| `packages/mobile/tsconfig.json`         | Create | Extends base                          |
| `supabase/config.toml`                  | Create | Supabase project config               |
| `supabase/migrations/00001_initial.sql` | Create | Schema + RLS + triggers + storage     |

**Total**: 21 new files, 0 modified, 0 deleted.

## Interfaces / Contracts

Core shared types (in `@mbt/shared/src/types/`):

```typescript
interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  tags: string[];
  isActive: boolean;
}
interface Customer {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  address?: object;
}
interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  total: number;
  shippingCost: number;
  discount: number;
  paymentStatus: string;
}
// + 6 more matching the DB schema
```

Zod schemas validate all monetary fields as positive numbers, UUIDs as `uuid()` format, and enum fields against the constant arrays.

## Testing Strategy

| Layer   | What         | Approach                                                                                                   |
| ------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Compile | All packages | `tsc --noEmit` — must pass with zero errors                                                                |
| Lint    | All source   | `eslint .` — flat config validates TypeScript rules                                                        |
| Format  | All source   | `prettier --check .` — consistent style enforcement                                                        |
| DB      | Migration    | Run against Supabase `db` branch or local Supabase CLI — verify tables, FKs, RLS, triggers via SQL queries |
| Auth    | Trigger      | Insert into `auth.users` — confirm `customers` row auto-created                                            |

**Note**: Strict TDD disabled per `openspec/config.yaml`. No test runner installed. Formal testing starts when Vitest is configured per-subproject in later phases.

## Migration / Rollout

No data migration (greenfield). Supabase project created on Free tier. The initial migration is applied once. Schema changes after Fase 0 require a NEW migration file — never modify `00001_initial.sql`.

## Risks

| Risk                                                     | Likelihood | Mitigation                                                                  |
| -------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Schema changes after Fase 0 require migration discipline | Medium     | Policy: never edit initial migration. Every change = new `00002_*.sql` file |
| Supabase project region far from Argentina               | Low        | Select `sa-east-1` (São Paulo) at project creation                          |
| pnpm version mismatch across dev machines                | Low        | Pin pnpm version in `package.json` `packageManager` field                   |
