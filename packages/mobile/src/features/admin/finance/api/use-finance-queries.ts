import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase';
import { buildPaginatedResponse, buildPagination } from '@mbt/shared';
import type { PaginatedResponse } from '@mbt/shared';

interface CashMovementSummary {
  type: string;
  amount: number;
}

interface CashMovementFilters {
  type?: string;
  page: number;
  pageSize: number;
}

type CashMovementRow = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  movement_date: string;
  created_by: string | null;
  created_at: string;
};

const FINANCE_KEY = ['admin', 'finance'] as const;

export function useCashMovements(filters: CashMovementFilters) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'cash-movements', filters.type ?? '', filters.page, filters.pageSize],
    queryFn: async (): Promise<PaginatedResponse<CashMovementRow>> => {
      const pagination = buildPagination(filters.page, filters.pageSize);
      let query = supabase
        .from('cash_movements')
        .select('*', { count: 'exact' });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const from = pagination.offset;
      const to = pagination.offset + pagination.pageSize - 1;
      query = query.range(from, to).order('movement_date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return buildPaginatedResponse(data ?? [], count ?? 0, pagination);
    },
  });
}

export function useMonthlySales() {
  return useQuery({
    queryKey: ['admin', 'finance', 'monthly-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_sales')
        .select('*')
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDailySales() {
  return useQuery({
    queryKey: ['admin', 'finance', 'daily-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['admin', 'finance', 'top-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top_products')
        .select('*')
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['admin', 'finance', 'low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock')
        .select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCashSummary() {
  return useQuery({
    queryKey: ['admin', 'finance', 'cash-summary'],
    queryFn: async () => {
      const { data: movements, error } = await supabase
        .from('cash_movements')
        .select('type, amount');

      if (error) throw error;

      const rows = (movements ?? []) as unknown as CashMovementSummary[];
      const totalIncome = rows
        .filter((m) => m.type === 'income')
        .reduce((sum, m) => sum + m.amount, 0);
      const totalExpense = rows
        .filter((m) => m.type === 'expense')
        .reduce((sum, m) => sum + m.amount, 0);

      return {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense,
      };
    },
  });
}

// ===========================================================================
// EXPENSES
// ===========================================================================

interface ExpenseFilters {
  category?: string;
  page: number;
  pageSize: number;
}

type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
};

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'expenses', filters.category ?? '', filters.page, filters.pageSize],
    queryFn: async (): Promise<PaginatedResponse<ExpenseRow>> => {
      const pagination = buildPagination(filters.page, filters.pageSize);
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const from = pagination.offset;
      const to = pagination.offset + pagination.pageSize - 1;
      query = query.range(from, to).order('expense_date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return buildPaginatedResponse(data ?? [], count ?? 0, pagination);
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      description: string;
      amount: number;
      category: string;
      expense_date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('expenses')
        .insert({
          description: input.description,
          amount: input.amount,
          category: input.category,
          expense_date: input.expense_date ?? new Date().toISOString().split('T')[0],
          created_by: user?.id ?? null,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Gasto registrado', 'El gasto se registró correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo registrar el gasto: ${error.message}`);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Gasto eliminado', 'El gasto se eliminó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo eliminar el gasto: ${error.message}`);
    },
  });
}

// ===========================================================================
// PURCHASES
// ===========================================================================

type PurchaseRow = {
  id: string;
  supplier_name: string;
  invoice_number: string | null;
  total: number;
  notes: string | null;
  purchase_date: string;
  created_by: string | null;
  created_at: string;
};

export function usePurchases(page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'purchases', page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<PurchaseRow>> => {
      const pagination = buildPagination(page, pageSize);
      let query = supabase
        .from('purchases')
        .select('*', { count: 'exact' });

      const from = pagination.offset;
      const to = pagination.offset + pagination.pageSize - 1;
      query = query.range(from, to).order('purchase_date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return buildPaginatedResponse(data ?? [], count ?? 0, pagination);
    },
  });
}

interface CreatePurchaseInput {
  supplier_name: string;
  invoice_number?: string;
  total: number;
  notes?: string;
  purchase_date?: string;
  items: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_cost: number;
  }[];
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          supplier_name: input.supplier_name,
          invoice_number: input.invoice_number ?? null,
          total: input.total,
          notes: input.notes ?? null,
          purchase_date: input.purchase_date ?? new Date().toISOString().split('T')[0],
        } as never)
        .select('id')
        .single<{ id: string }>();

      if (purchaseError) throw purchaseError;

      if (input.items.length > 0) {
        const purchaseItems = input.items.map((item) => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          subtotal: item.quantity * item.unit_cost,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItems as never);

        if (itemsError) throw itemsError;
      }

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      Alert.alert('Compra registrada', 'La compra se registró correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo registrar la compra: ${error.message}`);
    },
  });
}
