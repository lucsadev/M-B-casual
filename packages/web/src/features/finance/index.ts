/**
 * Finance module barrel — public API surface.
 *
 * Exports:
 * - Components: KpiCards, IncomeExpenseChart, ProfitabilityTable, DateRangeFilter
 * - Pages: DashboardPage, ExpensesPage, PurchasesPage, CashMovementsPage
 * - Hooks: all TanStack Query hooks from use-finance
 * - Types: API query filters, data types, and shared finance types
 */

// =============================================================================
// Pages
// =============================================================================

export { DashboardPage } from './pages/dashboard-page.js';
export { ExpensesPage } from './pages/expenses-page.js';
export { PurchasesPage } from './pages/purchases-page.js';
export { CashMovementsPage } from './pages/cash-movements-page.js';

// =============================================================================
// Components
// =============================================================================

export { KpiCards } from './components/kpi-cards.js';
export type { KpiCardsProps } from './components/kpi-cards.js';

export { IncomeExpenseChart } from './components/income-expense-chart.js';
export type { IncomeExpenseChartProps } from './components/income-expense-chart.js';

export { ProfitabilityTable } from './components/profitability-table.js';
export type { ProfitabilityTableProps } from './components/profitability-table.js';

export { DateRangeFilter } from './components/date-range-filter.js';
export type { DateRangeFilterProps, DateRange } from './components/date-range-filter.js';

// =============================================================================
// Hooks
// =============================================================================

export {
  useDashboardKPI,
  useMonthlyChart,
  useProductProfitability,
  useExpenses,
  useExpense,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  usePurchases,
  usePurchase,
  useCreatePurchase,
  useConfirmPurchase,
  useCashMovements,
  useBalance,
} from './hooks/use-finance.js';

// =============================================================================
// API Query functions
// =============================================================================

export {
  getDashboardKPI,
  getMonthlyChartData,
  getProductProfitability,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getPurchases,
  getPurchaseById,
  createPurchase,
  confirmPurchase,
  getCashMovements,
  getBalance,
} from './api/queries.js';

// =============================================================================
// API query types
// =============================================================================

export type {
  DashboardKPIFilters,
  ExpenseFilters,
  CreateExpenseInput,
  UpdateExpenseInput,
  PurchaseFilters,
  CreatePurchaseInput,
  CashMovementFilters,
  MonthlyChartDataPoint,
  ProductProfitabilityRow,
} from './api/queries.js';

// Re-exported from shared types for convenience
export type {
  DashboardKPI,
  Expense,
  ExpenseCategory,
  Purchase,
  PurchaseItem,
  CashMovement,
  CashMovementType,
} from '@mbt/shared';
