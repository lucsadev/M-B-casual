/**
 * Finance TanStack Query hooks.
 *
 * Wraps raw API queries (`queries.ts`) with React Query caching,
 * auto-invalidation, and toast notifications on mutations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
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
} from '../api/queries';
import type {
  DashboardKPIFilters,
  ExpenseFilters,
  CreateExpenseInput,
  UpdateExpenseInput,
  PurchaseFilters,
  CreatePurchaseInput,
  CashMovementFilters,
} from '../api/queries';

/** Root query key prefix for all finance queries */
const FINANCE_KEY = ['finance'] as const;

// =============================================================================
// DASHBOARD KPIs
// =============================================================================

/**
 * Hook: aggregate dashboard KPIs for a date range.
 */
export function useDashboardKPI(filters: DashboardKPIFilters) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'dashboard-kpi', filters],
    queryFn: () => getDashboardKPI(filters),
  });
}

// =============================================================================
// MONTHLY CHART (Income vs Expense)
// =============================================================================

/**
 * Hook: income vs expense data grouped by month for chart display.
 */
export function useMonthlyChart(months: number = 6) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'monthly-chart', months],
    queryFn: () => getMonthlyChartData(months),
  });
}

// =============================================================================
// PRODUCT PROFITABILITY
// =============================================================================

/**
 * Hook: product profitability data from the `product_profitability` view.
 */
export function useProductProfitability() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'product-profitability'],
    queryFn: getProductProfitability,
  });
}

// =============================================================================
// EXPENSES
// =============================================================================

/**
 * Hook: list expenses with optional filters.
 */
export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'expenses', filters],
    queryFn: () => getExpenses(filters),
  });
}

/**
 * Hook: single expense by ID.
 */
export function useExpense(id: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'expenses', id],
    queryFn: () => getExpenseById(id),
    enabled: id.length > 0,
  });
}

/**
 * Hook: create a new expense (mutation).
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Gasto registrado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar gasto: ${error.message}`);
    },
  });
}

/**
 * Hook: update an existing expense (mutation).
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Gasto actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar gasto: ${error.message}`);
    },
  });
}

/**
 * Hook: delete an expense (mutation).
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Gasto eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar gasto: ${error.message}`);
    },
  });
}

// =============================================================================
// PURCHASES
// =============================================================================

/**
 * Hook: list purchases with optional filters.
 */
export function usePurchases(filters: PurchaseFilters = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'purchases', filters],
    queryFn: () => getPurchases(filters),
  });
}

/**
 * Hook: single purchase with line items.
 */
export function usePurchase(id: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'purchases', id],
    queryFn: () => getPurchaseById(id),
    enabled: id.length > 0,
  });
}

/**
 * Hook: create a new purchase with line items (mutation).
 */
export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Compra registrada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar compra: ${error.message}`);
    },
  });
}

/**
 * Hook: confirm a purchase — triggers stock update via DB trigger (mutation).
 */
export function useConfirmPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmPurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Compra confirmada — stock actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al confirmar compra: ${error.message}`);
    },
  });
}

// =============================================================================
// CASH MOVEMENTS
// =============================================================================

/**
 * Hook: list cash movements with optional date range.
 */
export function useCashMovements(filters: CashMovementFilters = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'cash-movements', filters],
    queryFn: () => getCashMovements(filters),
  });
}

/**
 * Hook: compute current balance from all cash movements.
 */
export function useBalance() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'balance'],
    queryFn: getBalance,
  });
}
