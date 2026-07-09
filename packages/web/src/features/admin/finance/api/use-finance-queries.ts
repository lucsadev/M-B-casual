/**
 * Admin finance queries and mutations.
 *
 * Covers:
 * - Expenses: list, create, update, delete
 * - Purchases: list, create, detail
 * - Cash movements: list, create
 * - Dashboard KPIs: daily sales, monthly sales, top products
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { buildPaginatedResponse, buildPagination } from '@mbt/shared';
import type { PaginatedResponse } from '@mbt/shared';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type PurchaseRow = Database['public']['Tables']['purchases']['Row'];
type CashMovementRow = Database['public']['Tables']['cash_movements']['Row'];
type MonthlySalesRow = Database['public']['Views']['monthly_sales']['Row'];
type DailySalesRow = Database['public']['Views']['daily_sales']['Row'];
type TopProductRow = Database['public']['Views']['top_products']['Row'];
type ProductProfitabilityRow = Database['public']['Views']['product_profitability']['Row'];
type CustomerSummaryRow = Database['public']['Views']['customer_summary']['Row'];

const FINANCE_KEY = ['admin', 'finance'] as const;

// ===========================================================================
// DASHBOARD KPIs
// ===========================================================================

// ---- Monthly sales ----
async function fetchMonthlySales(): Promise<MonthlySalesRow[]> {
  const { data, error } = await supabase
    .from('monthly_sales')
    .select('*')
    .limit(12);

  if (error) throw error;
  return (data ?? []) as unknown as MonthlySalesRow[];
}

export function useMonthlySales() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'monthly-sales'],
    queryFn: fetchMonthlySales,
  });
}

// ---- Daily sales (today) ----
async function fetchDailySales(): Promise<DailySalesRow[]> {
  const { data, error } = await supabase
    .from('daily_sales')
    .select('*');

  if (error) throw error;
  return (data ?? []) as unknown as DailySalesRow[];
}

export function useDailySales() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'daily-sales'],
    queryFn: fetchDailySales,
  });
}

// ---- Top products ----
async function fetchTopProducts(): Promise<TopProductRow[]> {
  const { data, error } = await supabase
    .from('top_products')
    .select('*')
    .limit(10);

  if (error) throw error;
  return (data ?? []) as unknown as TopProductRow[];
}

export function useTopProducts() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'top-products'],
    queryFn: fetchTopProducts,
  });
}

// ---- Low stock ----
async function fetchLowStock() {
  const { data, error } = await supabase
    .from('low_stock')
    .select('*');

  if (error) throw error;
  return data ?? [];
}

export function useLowStock() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'low-stock'],
    queryFn: fetchLowStock,
  });
}

// ---- Product profitability ----
async function fetchProductProfitability(): Promise<ProductProfitabilityRow[]> {
  const { data, error } = await supabase
    .from('product_profitability')
    .select('*')
    .limit(20);

  if (error) throw error;
  return (data ?? []) as unknown as ProductProfitabilityRow[];
}

export function useProductProfitability() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'product-profitability'],
    queryFn: fetchProductProfitability,
  });
}

// ---- Customer summary ----
async function fetchCustomerSummary(): Promise<CustomerSummaryRow[]> {
  const { data, error } = await supabase
    .from('customer_summary')
    .select('*')
    .limit(20);

  if (error) throw error;
  return (data ?? []) as unknown as CustomerSummaryRow[];
}

export function useCustomerSummary() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'customer-summary'],
    queryFn: fetchCustomerSummary,
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

async function fetchExpenses(filters: ExpenseFilters): Promise<PaginatedResponse<ExpenseRow>> {
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
}

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'expenses', filters],
    queryFn: () => fetchExpenses(filters),
  });
}

// ---- Create expense ----
async function createExpense(input: {
  description: string;
  amount: number;
  category: string;
  expense_date?: string;
  receipt_url?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('expenses')
    .insert({
      description: input.description,
      amount: input.amount,
      category: input.category,
      expense_date: input.expense_date ?? new Date().toISOString().split('T')[0],
      receipt_url: input.receipt_url ?? null,
      created_by: user?.id ?? null,
    } as never);

  if (error) throw error;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Gasto registrado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar gasto: ${error.message}`);
    },
  });
}

// ---- Delete expense ----
async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Gasto eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar gasto: ${error.message}`);
    },
  });
}

// ===========================================================================
// PURCHASES (supplier orders)
// ===========================================================================

async function fetchPurchases(page: number, pageSize: number): Promise<PaginatedResponse<PurchaseRow>> {
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
}

export function usePurchases(page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'purchases', { page, pageSize }],
    queryFn: () => fetchPurchases(page, pageSize),
  });
}

// ---- Create purchase ----
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

async function createPurchase(input: CreatePurchaseInput) {
  // Create purchase
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

  // Create purchase items
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
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Compra registrada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar compra: ${error.message}`);
    },
  });
}

// ===========================================================================
// CASH MOVEMENTS
// ===========================================================================

interface CashMovementFilters {
  type?: string;
  page: number;
  pageSize: number;
}

async function fetchCashMovements(filters: CashMovementFilters): Promise<PaginatedResponse<CashMovementRow>> {
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
}

export function useCashMovements(filters: CashMovementFilters) {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'cash-movements', filters],
    queryFn: () => fetchCashMovements(filters),
  });
}

// ---- Create cash movement ----
async function createCashMovement(input: {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  movement_date?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('cash_movements')
    .insert({
      type: input.type,
      amount: input.amount,
      description: input.description,
      reference_type: input.reference_type ?? null,
      reference_id: input.reference_id ?? null,
      movement_date: input.movement_date ?? new Date().toISOString().split('T')[0],
      created_by: user?.id ?? null,
    } as never);

  if (error) throw error;
}

export function useCreateCashMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCashMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Movimiento de caja registrado');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar movimiento: ${error.message}`);
    },
  });
}

// ---- Cash summary ----
interface CashMovementSummary {
  type: string;
  amount: number;
}

async function fetchCashSummary(): Promise<{ total_income: number; total_expense: number; balance: number }> {
  // Calculate from cash_movements table directly
  const { data: movements, error: movementsError } = await supabase
    .from('cash_movements')
    .select('type, amount');

  if (movementsError) throw movementsError;

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
}

export function useCashSummary() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'cash-summary'],
    queryFn: fetchCashSummary,
  });
}
