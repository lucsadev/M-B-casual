/**
 * Finance TanStack Query hooks.
 *
 * Ported from web's features/finance/hooks/use-finance.ts
 * Uses Alert.alert instead of toast for mobile.
 */
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const FINANCE_KEY = ['finance'] as const;

// =============================================================================
// DASHBOARD KPIs
// =============================================================================

export function useDashboardKPI(filters: DashboardKPIFilters) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'dashboard-kpi', filters],
    queryFn: () => getDashboardKPI(filters),
  });
}

// =============================================================================
// MONTHLY CHART
// =============================================================================

export function useMonthlyChart(months: number = 6) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'monthly-chart', months],
    queryFn: () => getMonthlyChartData(months),
  });
}

// =============================================================================
// PRODUCT PROFITABILITY
// =============================================================================

export function useProductProfitability() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'product-profitability'],
    queryFn: getProductProfitability,
  });
}

// =============================================================================
// EXPENSES
// =============================================================================

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'expenses', filters],
    queryFn: () => getExpenses(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'expenses', id],
    queryFn: () => getExpenseById(id),
    enabled: id.length > 0,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Gasto registrado', 'El gasto se registró correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo registrar el gasto: ${error.message}`);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Gasto actualizado', 'El gasto se actualizó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo actualizar el gasto: ${error.message}`);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Gasto eliminado', 'El gasto se eliminó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo eliminar el gasto: ${error.message}`);
    },
  });
}

// =============================================================================
// PURCHASES
// =============================================================================

export function usePurchases(filters: PurchaseFilters = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'purchases', filters],
    queryFn: () => getPurchases(filters),
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'purchases', id],
    queryFn: () => getPurchaseById(id),
    enabled: id.length > 0,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Compra registrada', 'La compra se registró correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo registrar la compra: ${error.message}`);
    },
  });
}

export function useConfirmPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmPurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Compra confirmada', 'Compra confirmada — stock actualizado.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo confirmar la compra: ${error.message}`);
    },
  });
}

// =============================================================================
// CASH MOVEMENTS
// =============================================================================

export function useCashMovements(filters: CashMovementFilters = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'cash-movements', filters],
    queryFn: () => getCashMovements(filters),
  });
}

export function useBalance() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'balance'],
    queryFn: getBalance,
  });
}
