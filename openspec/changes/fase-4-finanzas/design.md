# Design: Fase 4 — Finanzas

## Technical Approach

Backend is already provisioned (migration `00005` with views, triggers, stock function). This phase completes: (1) update order trigger from `delivered` → `confirmed`, (2) add window-based running balance, (3) build the dashboard page (Recharts bar chart + profitability table + KPI cards), (4) add date-range filters to existing pages, (5) install Recharts. The API layer (`use-finance-queries.ts`) and admin pages exist but need refinement to match spec coverage.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Order cash trigger point | `status = 'confirmed'` | `delivered` (current) | Spec requires income on confirm; many orders never reach delivered (local pickup) |
| Dashboard queries | Multiple independent TanStack queries | Single large DB query | Individual cache per KPI; partial loading states; reusable across pages |
| Running balance | DB window function `SUM OVER(ORDER BY)` | Client-side reduce (current) | Handles pagination correctly; no need to fetch all rows |
| Chart library | Recharts | Chart.js, Nivo | Already shadcn/ui-compatible; React-native; bar/line charts are trivial |
| Date range filter | Shared hook `useDateRange` + query params pattern | Per-page state | Reusable across dashboard, expenses, purchases, cash movements |

## Data Flow

```
Admin triggers:                     
  Expense INSERT ──► trg_expense_cash_movement ──► cash_movements (expense)
  Purchase INSERT ──► trg_purchase_cash_movement ──► cash_movements (expense)
  Purchase INSERT ──► trg_purchase_item_stock_update ──► product_variants.stock += qty
  Order UPDATE status='confirmed' ──► trg_order_cash_movement ──► cash_movements (income)

Dashboard:                         
  AdminFinancePage                   
    ├─ useFinanceKPIs()    ──► monthly_sales + cash_movements (aggregated)
    ├─ useMonthlyChart()   ──► grouped monthly income/expense
    ├─ useProductProfitability() ──► product_profitability view
    └─ useCashMovements()  ──► cash_movements + window running_balance
```

## Module Structure

```
packages/web/src/features/admin/finance/
├── api/
│   └── use-finance-queries.ts         (MODIFY — add date range, update expense, running balance)
├── hooks/
│   └── use-date-range.ts              (NEW — shared date range hook)
├── pages/
│   ├── dashboard-page.tsx             (NEW — KPI cards, Recharts bar chart, profitability table)
│   ├── expenses-page.tsx              (MODIFY — add date range filter)
│   ├── purchases-page.tsx             (MODIFY — add supplier filter + date range)
│   └── cash-movements-page.tsx        (MODIFY — add running balance column)
├── components/
│   ├── kpi-card.tsx                   (NEW — reusable KPI card)
│   ├── income-expense-chart.tsx       (NEW — Recharts bar chart)
│   └── profitability-table.tsx        (NEW — product margin table)
└── index.ts                           (MODIFY — export new components)

supabase/migrations/
└── 00006_finance_refinements.sql      (NEW — order trigger on confirmed, running balance fn)
```

## File Manifest

| File | Action | Description |
|---|---|---|
| `supabase/migrations/00006_finance_refinements.sql` | Create | Update order trigger to `confirmed`, add `cash_movements_running_balance` view |
| `packages/web/package.json` | Modify | Add `recharts` dependency |
| `packages/web/src/features/admin/finance/api/use-finance-queries.ts` | Modify | Add date range params, `useUpdateExpense`, `useFinanceKPIs`, `useCashMovementsRunningBalance` |
| `packages/web/src/features/admin/finance/hooks/use-date-range.ts` | Create | Shared date range state hook (startDate, endDate, PresetSelector) |
| `packages/web/src/features/admin/finance/components/kpi-card.tsx` | Create | Reusable KPI display card (title, value, trend, color) |
| `packages/web/src/features/admin/finance/components/income-expense-chart.tsx` | Create | Recharts `<BarChart>` with 6-month grouped bars (income=blue, expense=red) |
| `packages/web/src/features/admin/finance/components/profitability-table.tsx` | Create | shadcn DataTable: product, revenue, cogs, margin, margin% |
| `packages/web/src/features/admin/finance/pages/dashboard-page.tsx` | Create | Main `/admin/finanzas` dashboard — KPIs + chart + profitability |
| `packages/web/src/app/pages/finance-admin.tsx` | Modify | Redirect to dashboard-page or wrap it |
| `packages/web/src/app/pages/expenses-admin.tsx` | Modify | Add date range filter, edit capability |
| `packages/web/src/app/pages/purchases-admin.tsx` | Modify | Add supplier name partial match filter, date range |
| `packages/web/src/app/router.tsx` | Modify | Change `/admin/finanzas` → dashboard; keep `/admin/gastos`, `/admin/compras` |

## Interfaces / Contracts

```typescript
// Running balance — new view
interface CashMovementWithBalance {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  reference_type: string | null;
  movement_date: string;
  running_balance: number;  // cumulative SUM OVER()
}

// Finance KPIs (monthly aggregation)
interface FinanceKPIs {
  month_revenue: number;
  month_expenses: number;
  month_margin: number;
  month_order_count: number;
  last_month_revenue: number;  // for trend comparison
}

// Date range filter
interface DateRange {
  from: string;   // ISO date
  to: string;     // ISO date
}
```

## Implementation Order

| Step | What | Why first |
|---|---|---|
| 1 | `00006` migration: order trigger on `confirmed`, running balance view | Foundation for everything |
| 2 | Install `recharts` | Required for chart component |
| 3 | Add `useDateRange` hook + update finance queries with date range params | Unlocks filters across all pages |
| 4 | Create KPI card, chart, profitability components | Atomic UI pieces |
| 5 | Build `dashboard-page.tsx` | Core deliverable — `/admin/finanzas` |
| 6 | Update `expenses-admin.tsx` with date range filter + edit | Spec completion |
| 7 | Update `purchases-admin.tsx` with supplier + date filters | Spec completion |
| 8 | Update router, wire everything | Integration |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | `useDateRange` hook | Test preset selection, custom range, serialization |
| Unit | `kpi-card` | Snapshot with various values/colors |
| Integration | Updated `use-finance-queries` | Extend existing mock-based tests for new query params |
| Integration | Migration `00006` | Run against local Supabase: confirm trigger, running balance |

## Migration / Rollout

1. Run `supabase migration up 00006` — additive only (no drop/alter of existing objects)
2. The order trigger change (`delivered` → `confirmed`) applies only to new updates; existing orders at `delivered` keep their cash movements
3. No data migration needed. Feature flag not required — `/admin/finanzas` already existed as a cash-only page; replacing it with the dashboard is backward-compatible

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Existing orders at `confirmed` already have cash movements from admin manual action | Low | `ON CONFLICT DO NOTHING` guard in trigger function |
| Recharts bundle size | Low | Dynamic import + tree-shaking; only BarChart used |
| Date range filter causes excessive DB queries | Low | TanStack Query cache key includes range; same range → cache hit |

## Open Questions

- None. Design is fully actionable based on the existing codebase analysis.
