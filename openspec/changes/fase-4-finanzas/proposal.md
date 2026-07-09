# Proposal: Fase 4 — Finanzas

## Intent

Enable admin users (Marianela, Belén) to track finances: register operating expenses, record supplier purchases with automatic stock update, view cash flow, and analyze profitability through a dashboard with KPIs and charts. The DB schema and API layer are partially built — this phase completes the UI, missing views, and cash movement automation.

## Scope

### In Scope
- Expense CRUD with category/date filters (admin web)
- Purchase registration with line items + auto stock update on confirm
- Financial dashboard: monthly income, expenses, gross margin, profitability
- Income vs expenses chart (6-month), profitability table per product
- Cash movements ledger with balance evolution
- DB migration: profitability view, cash_movements auto-insert triggers

### Out of Scope
- Report export (PDF/Excel) — deferred
- AFIP/tax integration — deferred
- Payment due notifications — deferred
- Mobile finance views — admin web only

## Capabilities

### New Capabilities
- `admin-expenses`: CRUD for operational expenses with category/date filters
- `admin-purchases`: Supplier purchase registration with line items + auto stock update
- `admin-finance-dashboard`: KPI dashboard with revenue/expense charts and profitability table
- `admin-cash-movements`: Cash flow ledger with income/expense tracking and running balance

### Modified Capabilities
- `database-schema`: Add `product_profitability` view; verify existing views remain healthy
- `admin-catalog`: Stock is now also updated by purchase confirmations (not just manual variant edit)

## Approach

- **Backend**: Migration `00005_finance_views.sql` — create `product_profitability` view (revenue - COGS per product). DB triggers auto-insert `cash_movements` on expense insert, purchase insert, and order status → 'delivered'.
- **Web**: Feature `admin/finance/` with sub-pages (dashboard, expenses, purchases, cash). Consumes existing `use-finance-queries.ts` API layer. Recharts for charts. shadcn DataTable for list views.
- **Stock update**: On purchase confirm, Edge Function or DB function atomic-updates `product_variants.stock += quantity` per item.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/web/src/features/admin/finance/` | New | Dashboard, expenses, purchases, cash pages |
| `packages/web/src/app/router.tsx` | Modified | Add `/admin/finanzas`, `/admin/gastos`, `/admin/compras` routes |
| `supabase/migrations/00005_finance_views.sql` | New | Profitability view, cash_movements triggers |
| `packages/shared/src/types/` | Modified | Add finance-related types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stock sync race (purchase + manual edit) | Low | DB function for atomic `UPDATE stock = stock + quantity` in transaction |
| Cash movement double-count | Medium | DB trigger per entity ensures exactly one movement per order/expense/purchase |

## Rollback Plan

Drop migration `00005`, revert finance page files, remove routes from router. No destructive schema changes — all finance tables already exist.

## Dependencies

- Supabase online with `purchases`, `purchase_items`, `expenses`, `cash_movements` tables (from migration `00001`)
- Migration `00003` with `daily_sales`, `top_products`, `customer_summary` views

## Success Criteria

- [ ] Admin creates expense → appears in list and cash movements as "egreso"
- [ ] Admin creates purchase → items logged, stock updated automatically
- [ ] Dashboard KPIs match actual orders/expenses data
- [ ] Cash movements reflect every order (income), expense (egreso), purchase (egreso)
- [ ] Profitability view shows correct margin per product
