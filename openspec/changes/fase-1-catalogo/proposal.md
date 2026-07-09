# Proposal: Fase 1 — Catálogo de Productos

## Intent

M&B Trend necesita su funcionalidad core: catálogo de productos visible para clientes (web y mobile) y gestionable por admin. Sin esto no existe el negocio digital.

## Scope

### In Scope
- Admin CRUD: productos, variantes (talle/color/stock/SKU), carga de imágenes a Storage
- Web público: grilla con filtros por categoría, búsqueda por nombre, paginación, detalle con selector de variante
- Mobile público: mismo contenido, FlatList con scroll infinito, detalle con selector nativo
- API catalog: hooks TanStack Query compartidos, cliente Supabase tipado

### Out of Scope
- Carrito de compras, checkout, órdenes (Fase 2)
- Autenticación de clientes (Fase 3)
- Dashboard admin con KPIs (Fase 5)
- Cache offline en mobile (Fase 6)

## Capabilities

### New Capabilities
- `admin-catalog`: CRUD de productos/variantes, carga de imágenes a Supabase Storage, categorización
- `catalog-display`: Grilla pública web con filtros, búsqueda, paginación y página de detalle de producto
- `mobile-catalog`: Catálogo mobile nativo con scroll infinito (FlatList), detalle con selector talle/color

### Modified Capabilities
- `database-schema`: Nuevos índices para búsqueda (`products.name` trigram) y filtrado por categoría
- `shared-package`: Tipos adicionales si el catálogo necesita helpers específicos (ej: filtros, ordenamiento)

## Approach

1. **Admin CRUD**: Feature `admin/` en web. Formularios con shadcn/ui (DataTable, Dialog, Form). Upload de imágenes → Supabase Storage vía `admin-catalog`
2. **API catalog**: Hooks TanStack Query (`useProducts`, `useProduct`, `useCategories`) en `web/src/features/catalog/api/` y `mobile/src/features/catalog/api/`, compartiendo tipos desde `@mbt/shared`
3. **Web catalog**: Páginas con React Router (`/catalogo`, `/catalogo/:category`, `/producto/:slug`). Filtros en query params. Paginación offset-based
4. **Mobile catalog**: Expo Router (`/catalog`, `/catalog/:category`, `/product/:slug`). Scroll infinito con `useInfiniteQuery` + FlatList

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/web/src/features/admin/` | New | Admin product/variant CRUD |
| `packages/web/src/features/catalog/` | New | Public catalog UI + TanStack hooks |
| `packages/mobile/src/features/catalog/` | New | Mobile catalog screens + hooks |
| `supabase/migrations/` | New | Performance indexes, search support |
| `packages/shared/src/types/` | Modified | Add filter/sort types if needed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Image upload UX sin feedback | Medium | Progress indicators + toast en admin |
| Búsqueda lenta sin Postgres FTS | Low | Trigram indexes + `ILIKE` como MVP |
| Diferencias Mobile/Web en variantes | Medium | Shared types garantizan contrato único |
| RLS mal configurada (público no ve nada) | Low | Tests manuales de SELECT público |

## Rollback Plan

- **Code**: `git revert` de commits del feature. Mantener migraciones separadas para rollback SQL
- **Supabase**: Nueva migration `00002_revert_catalog_indexes.sql` si los índices afectan performance
- **Storage**: Las imágenes subidas se quedan en el bucket (sin referencias en DB tras rollback)

## Dependencies

- Fase 0 completada (monorepo, BD, shared package, tooling)
- Supabase project activo con storage bucket `product-images`

## Success Criteria

- [ ] Admin puede crear/editar/eliminar productos con imágenes
- [ ] Admin puede gestionar variantes (talle, color, stock, SKU)
- [ ] Web pública lista productos con filtros por categoría y búsqueda
- [ ] Mobile muestra productos con scroll infinito
- [ ] Detalle de producto en ambas plataformas permite seleccionar variante
- [ ] Imágenes se sirven correctamente desde Supabase Storage
