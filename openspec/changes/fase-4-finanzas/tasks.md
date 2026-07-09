# Tasks: Fase 4 — Finanzas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (DB+hooks) → PR 2 (Dashboard) → PR 3 (Filters+wire) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Migration `00006_finance_triggers` + shared types + finance API queries + hooks | PR 1 | ✅ Done — DB migration, shared types, API queries, and TanStack Query hooks |
| 2 | KPI card + Recharts chart + profitability table + dashboard page | PR 2 | Base=PR 1 branch, ~285 lines, depends on PR 1 |
| 3 | Date-range filters on expenses/purchases + running balance on cash + router + sidebar | PR 3 | Base=PR 2 branch, ~145 lines, depends on PR 1-2 |

## Phase 1: Foundation (DB + types + API)

- [x] 1.1 `supabase/migrations/00006_finance_triggers.sql` — add purchases.status column, order trigger on `confirmed`, purchase confirm stock trigger, recreate expense/purchase cash triggers
- [x] 1.2 `packages/shared/src/types/finance.ts` — update canonical types (Expense, ExpenseCategory, Purchase with status, PurchaseItem, CashMovement, DashboardKPI)
- [x] 1.3 `packages/shared/src/types/index.ts` — update exports, remove dupes from expense.ts/purchase.ts
- [x] 1.4 `packages/web/src/features/finance/api/queries.ts` — raw Supabase query functions (getDashboardKPI, getExpenses, getPurchases, getCashMovements, CRUD)
- [x] 1.5 `packages/web/src/features/finance/hooks/use-finance.ts` — TanStack Query hooks (useDashboardKPI, useExpenses, usePurchases, useCashMovements, mutations)

## Phase 2: Core UI — Dashboard Components

- [x] 2.1 `features/finance/components/kpi-cards.tsx` — reusable KPI card grid (ingresos, gastos, margen, órdenes) with loading skeleton
- [x] 2.2 `features/finance/components/income-expense-chart.tsx` — Recharts `<BarChart>` 6-month grouped (income=#22C55E, expense=#EF4444)
- [x] 2.3 `features/finance/components/profitability-table.tsx` — sortable table: product, revenue, COGS, margin%, gross profit + color badges
- [x] 2.4 `features/finance/components/date-range-filter.tsx` — date from/to inputs, 5 quick presets, apply button
- [x] 2.5 `features/finance/index.ts` — barrel exports for all components, hooks, queries, and types
- [x] 2.6 `features/finance/pages/dashboard-page.tsx` — `/admin/finanzas` with KPI cards + chart + profitability table + recent movements
- [x] 2.7 Added `getMonthlyChartData` + `getProductProfitability` queries + `useMonthlyChart` + `useProductProfitability` hooks

## Phase 3: Integration — Existing Page Updates

- [x] 3.1 `features/finance/pages/cash-movements-page.tsx` — new cash movements page at `/admin/caja` with type + date filters, balance summary, and timeline
- [x] 3.2 `features/finance/pages/expenses-page.tsx` — new expenses CRUD page at `/admin/gastos` with date range filter, edit capability, delete confirmation
- [x] 3.3 `features/finance/pages/purchases-page.tsx` — new purchases page at `/admin/compras` with supplier + date range filters, line items, confirm button
- [x] 3.4 `app/router.tsx` — update routes: `/admin/finanzas` → DashboardPage, `/admin/gastos` → ExpensesPage, `/admin/compras` → PurchasesPage, `/admin/caja` → CashMovementsPage
- [x] 3.5 `app/layouts/admin-layout.tsx` — update sidebar with SVG icons, responsive mobile toggle, breadcrumb header, add "Caja" and "Finanzas" entries
