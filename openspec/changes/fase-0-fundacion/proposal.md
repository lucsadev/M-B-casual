# Proposal: Fase 0 — Fundación del Proyecto

## Intent

Establecer la base técnica del proyecto M&B Trend: monorepo, base de datos, paquete compartido y tooling. Sin esta fase no es posible comenzar el desarrollo de catálogo, carrito ni ninguna feature del negocio.

## Scope

### In Scope

- Monorepo pnpm workspaces con 3 packages (shared, web, mobile)
- Supabase project cloud + migración inicial (9 tablas, vistas, RLS)
- Paquete `@mbt/shared` (tipos, Zod schemas, constantes, utils)
- TypeScript + ESLint + Prettier + Git + README
- RLS policies base + Storage bucket `product-images`

### Out of Scope

- Componentes UI, páginas o rutas de las apps
- Catálogo, carrito, checkout, autenticación de clientes
- Edge Functions o integraciones externas (WhatsApp, Instagram)
- Offline-first, caché o persistencia mobile
- CI/CD, deployment o pipelines

## Capabilities

### New Capabilities

- `monorepo-setup`: Estructura pnpm workspaces con configuración base
- `shared-package`: Paquete `@mbt/shared` con tipos, validadores Zod, constantes y utilidades de formato
- `database-schema`: Migración Supabase con 9 tablas, vistas y RLS policies
- `supabase-auth`: Configuración de Supabase Auth con email/password
- `supabase-storage`: Bucket `product-images` con políticas RLS
- `tooling-base`: ESLint, Prettier, TypeScript, Git, README inicial

### Modified Capabilities

None — greenfield project, no existing capabilities.

## Approach

1. **Monorepo**: `pnpm init` + `pnpm-workspace.yaml` con 3 packages. TypeScript project references para compartir tipos.
2. **Supabase**: Crear project via dashboard. Ejecutar migración `00001_initial.sql` con schema completo + RLS + vistas.
3. **@mbt/shared**: Tipos derivados del schema SQL, Zod schemas para validación, constantes del catálogo (categorías, colores, talles), utils de formato (precios, fechas).
4. **Tooling**: ESLint flat config compartido, Prettier con reglas consistentes, `.gitignore` para Node + Expo + Supabase, README con instrucciones de setup.

## Affected Areas

| Area                   | Impact | Description                         |
| ---------------------- | ------ | ----------------------------------- |
| `package.json` (root)  | New    | pnpm workspaces root config         |
| `pnpm-workspace.yaml`  | New    | Workspace definition                |
| `packages/shared/`     | New    | Shared types, validators, constants |
| `packages/web/`        | New    | Web app scaffold (empty)            |
| `packages/mobile/`     | New    | Mobile app scaffold (empty)         |
| `supabase/migrations/` | New    | Initial schema SQL                  |
| `.gitignore`           | New    | Git ignore rules                    |
| `tsconfig.json` (×3)   | New    | TypeScript config per package       |

## Risks

| Risk                                            | Likelihood | Mitigation                                     |
| ----------------------------------------------- | ---------- | ---------------------------------------------- |
| Schema changes after Fase 0 requieren migración | Medium     | Nueva migration file, nunca editar la inicial  |
| Supabase project region lejana                  | Low        | Elegir región más cercana a Argentina al crear |
| Breaking changes en Expo/RN updates             | Low        | Pin exact SDK versions en package.json         |

## Rollback Plan

- **Monorepo**: `git clean -df` + reinstalar. `pnpm store` es externo, no se pierde nada.
- **Supabase**: Delete project desde dashboard. Migración es `00001_initial.sql` → si falla, `drop schema public cascade` + re-run.
- **@mbt/shared**: Ningún consumer depende aún → eliminar package sin impacto.

## Dependencies

- Node.js 20+ con pnpm 9+
- Supabase account (free tier)
- Expo CLI (opcional para init de mobile)
- Git

## Success Criteria

- [ ] `pnpm install` instala dependencias sin errores en los 3 packages
- [ ] `tsc --noEmit` pasa sin errores en todos los packages
- [ ] Migración SQL se ejecuta sin errores en Supabase project
- [ ] Supabase Auth acepta registro/login con email/password
- [ ] Storage bucket `product-images` creado con RLS funcional (SELECT público, INSERT solo admin)
- [ ] ESLint + Prettier ejecutan sin errores en todos los packages
