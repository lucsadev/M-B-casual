# Apply Progress: Fase 1 — Admin CRUD (PR 3 de 6)

**Change**: fase-1-catalogo
**Mode**: Standard (strict_tdd: false)
**Date**: 2026-07-07
**Delivery**: auto-forecast → stacked-to-main (PR 3 slice)

## Completed Tasks

### PR 1 — Foundation (previous)
| ID | Task | Status |
|----|------|--------|
| T001 | Install web dependencies | ✅ |
| T002 | Configure Vite + Router + layouts | ✅ |
| T003 | Configure Tailwind v4 + shadcn/ui | ✅ |
| T004 | Create Supabase typed client | ✅ |
| T005 | Create DB indexes migration | ✅ |
| T006 | Add shared type extensions | ✅ |
| T007 | Create seed-catalog.sql | ✅ |

### PR 2 — API Hooks Layer (previous)
| ID | Task | Status |
|----|------|--------|
| T008 | useCategories hook | ✅ |
| T009 | useProducts hook | ✅ |
| T010 | useProduct hook | ✅ |
| T011 | Supabase queries | ✅ |
| T012 | Barrel export (index.ts) | ✅ |

### PR 3 — Admin CRUD (this batch)
| ID | Task | Status |
|----|------|--------|
| T013 | AdminGuard component | ✅ |
| T014 | Admin layout + routing | ✅ |
| T015 | ProductListPage | ✅ |
| T016 | ProductFormPage + Form + VariantManager + ImageUploader | ✅ |
| T017 | Product delete dialog (in ProductListPage) | ✅ |
| T018 | useCreateProduct + useUpdateProduct + useDeleteProduct | ✅ |

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `packages/web/src/components/ui/button.tsx` | Created | shadcn/ui Button primitive |
| `packages/web/src/components/ui/input.tsx` | Created | shadcn/ui Input primitive |
| `packages/web/src/components/ui/label.tsx` | Created | shadcn/ui Label primitive |
| `packages/web/src/components/ui/textarea.tsx` | Created | shadcn/ui Textarea primitive |
| `packages/web/src/components/ui/badge.tsx` | Created | shadcn/ui Badge (incl. success variant) |
| `packages/web/src/components/ui/table.tsx` | Created | shadcn/ui Table primitives |
| `packages/web/src/components/ui/dialog.tsx` | Created | shadcn/ui Dialog with modal overlay |
| `packages/web/src/components/ui/select.tsx` | Created | shadcn/ui Select (native `<select>`) |
| `packages/web/src/components/ui/skeleton.tsx` | Created | shadcn/ui Skeleton loading |
| `packages/web/src/components/ui/toaster.tsx` | Created | sonner-based Toaster component |
| `packages/web/src/features/admin/guards/AdminGuard.tsx` | Created | T013 — Role-based route guard |
| `packages/web/src/features/admin/products/api/use-product-mutations.ts` | Created | T018 — CRUD mutations with cache invalidation |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | Created | T016 — Inline variant CRUD (useFieldArray) |
| `packages/web/src/features/admin/products/components/ImageUploader.tsx` | Created | T016 — Drag-drop upload to Supabase Storage |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` | Created | T016 — RHF + Zod product form |
| `packages/web/src/features/admin/products/pages/ProductListPage.tsx` | Created | T015 + T017 — Table, search, pagination, delete dialog |
| `packages/web/src/features/admin/products/pages/ProductFormPage.tsx` | Created | T016 — Create/Edit page |
| `packages/web/src/app/router.tsx` | Modified | T014 — Wired admin routes under AdminGuard |
| `packages/web/src/main.tsx` | Modified | Added Toaster component |
| `packages/web/package.json` | Modified | Added sonner dependency |

## Deviations from Design

- **shadcn/ui components**: Had to create them manually since none existed — project uses Tailwind v4 which isn't supported by the shadcn CLI. Created only the primitives needed.
- **VariantManager uses native `<select>`** instead of shadcn/ui SelectTrigger/SelectContent — simpler since no @radix-ui/react-select is installed.
- **ProductListPage fetches stock via separate query** instead of join — Supabase type inference on joins returns `never` with manually typed Database.
- **Mutations use `as unknown as never` cast** — manually typed Database types don't match supabase-js v2's internal mapping for insert/update generics.

## Issues Found

- Manual `Database` type doesn't let supabase-js infer insert/update types — needed explicit `as unknown as never` casts
- Supabase joins (`select('*, product_variants(*)')`) return `never` — workaround: two-step fetch for stock totals
- sonner was added as dependency for toast notifications
- Bundle chunk > 500 kB due to react-hook-form + zod + supabase-js

## Remaining Tasks

- [ ] Phase 4: Web catalog UI (PR 4)
- [ ] Phase 5: Mobile catalog UI (PR 5)
- [ ] Phase 6: Testing (PR 6)

## Workload / PR Boundary

- Mode: stacked PR slice (PR 3 of 6)
- Chain strategy: stacked-to-main
- Boundary: admin CRUD complete → ready for public catalog UI
- Estimated review budget: ~650 changed lines (components + pages + mutations + shadcn primitives)
