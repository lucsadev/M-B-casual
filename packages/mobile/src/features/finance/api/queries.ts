/**
 * Finance API queries — raw Supabase query functions.
 *
 * Ported from web's features/finance/api/queries.ts
 * Uses camelCase types from @mbt/shared.
 */
import { supabase } from '../../../lib/supabase';
import type {
  CashMovement,
  DashboardKPI,
  Expense,
  ExpenseCategory,
  Purchase,
  PurchaseItem,
} from '@mbt/shared';

// =============================================================================
// TYPES
// =============================================================================

export interface MonthlyChartDataPoint {
  month: string;
  income: number;
  expense: number;
}

export interface ProductProfitabilityRow {
  id: string;
  name: string;
  price: number;
  units_sold: number;
  total_revenue: number;
  estimated_cogs: number;
  margin_percent: number;
  gross_profit: number;
}

// =============================================================================
// DASHBOARD KPIs
// =============================================================================

export interface DashboardKPIFilters {
  fechaDesde: string;
  fechaHasta: string;
}

export async function getDashboardKPI(
  filters: DashboardKPIFilters,
): Promise<DashboardKPI> {
  const { fechaDesde, fechaHasta } = filters;

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'confirmed')
    .gte('created_at', fechaDesde)
    .lte('created_at', fechaHasta);

  if (ordersError) throw ordersError;

  const totalIngresos =
    ((ordersData as { total: number }[]) ?? []).reduce(
      (sum, o) => sum + Number(o.total), 0,
    );

  const cantidadOrdenes = (ordersData ?? []).length;

  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', fechaDesde)
    .lte('expense_date', fechaHasta);

  if (expensesError) throw expensesError;

  const totalGastos =
    ((expensesData as { amount: number }[]) ?? []).reduce(
      (sum, e) => sum + Number(e.amount), 0,
    );

  return {
    totalIngresos,
    totalGastos,
    margenBruto: totalIngresos - totalGastos,
    cantidadOrdenes,
    periodo: `${fechaDesde} – ${fechaHasta}`,
  };
}

// =============================================================================
// MONTHLY CHART
// =============================================================================

export async function getMonthlyChartData(
  months: number = 6,
): Promise<MonthlyChartDataPoint[]> {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const desdeStr = desde.toISOString().split('T')[0];
  const hastaStr = now.toISOString().split('T')[0];

  const { data: monthlySales, error: salesError } = await supabase
    .from('monthly_sales')
    .select('*')
    .gte('month', desdeStr)
    .lte('month', hastaStr);

  if (salesError) throw salesError;

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('expense_date, amount')
    .gte('expense_date', desdeStr)
    .lte('expense_date', hastaStr);

  if (expensesError) throw expensesError;

  const incomeByMonth = new Map<string, number>();
  for (const sale of monthlySales ?? []) {
    const month = String((sale as Record<string, unknown>).month ?? '');
    const monthKey = month.substring(0, 7) || 'unknown';
    incomeByMonth.set(
      monthKey,
      (incomeByMonth.get(monthKey) ?? 0) + Number((sale as Record<string, unknown>).revenue ?? 0),
    );
  }

  const expensesByMonth = new Map<string, number>();
  for (const exp of expenses ?? []) {
    const expDate = String((exp as Record<string, unknown>).expense_date ?? '');
    const monthKey = expDate.substring(0, 7) || 'unknown';
    expensesByMonth.set(
      monthKey,
      (expensesByMonth.get(monthKey) ?? 0) + Number((exp as Record<string, unknown>).amount ?? 0),
    );
  }

  const result: MonthlyChartDataPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      month: monthKey,
      income: incomeByMonth.get(monthKey) ?? 0,
      expense: expensesByMonth.get(monthKey) ?? 0,
    });
  }

  return result;
}

// =============================================================================
// PRODUCT PROFITABILITY
// =============================================================================

export async function getProductProfitability(): Promise<ProductProfitabilityRow[]> {
  const { data, error } = await supabase
    .from('product_profitability')
    .select('*')
    .order('margin_percent', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ProductProfitabilityRow[];
}

// =============================================================================
// EXPENSES
// =============================================================================

export interface ExpenseFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: ExpenseCategory;
}

export async function getExpenses(
  filters: ExpenseFilters = {},
): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (filters.fechaDesde) query = query.gte('expense_date', filters.fechaDesde);
  if (filters.fechaHasta) query = query.lte('expense_date', filters.fechaHasta);
  if (filters.categoria) query = query.eq('category', filters.categoria);

  const { data, error } = await query;
  if (error) throw error;

  // Map snake_case → camelCase
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    description: row.description as string,
    amount: row.amount as number,
    category: row.category as ExpenseCategory,
    expenseDate: (row.expense_date as string) ?? '',
    receiptUrl: (row.receipt_url as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
  }));
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    description: row.description as string,
    amount: row.amount as number,
    category: row.category as ExpenseCategory,
    expenseDate: (row.expense_date as string) ?? '',
    receiptUrl: (row.receipt_url as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
  };
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate?: string;
  receiptUrl?: string | null;
}

export async function createExpense(input: CreateExpenseInput): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from('expenses').insert({
    description: input.description,
    amount: input.amount,
    category: input.category,
    expense_date: input.expenseDate ?? new Date().toISOString().split('T')[0],
    receipt_url: input.receiptUrl ?? null,
    created_by: user.user?.id ?? null,
  } as never);
  if (error) throw error;
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  expenseDate?: string;
  receiptUrl?: string | null;
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.expenseDate !== undefined) updateData.expense_date = input.expenseDate;
  if (input.receiptUrl !== undefined) updateData.receipt_url = input.receiptUrl;

  const { error } = await supabase
    .from('expenses')
    .update(updateData as never)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================================
// PURCHASES
// =============================================================================

export interface PurchaseFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  proveedor?: string;
}

export async function getPurchases(
  filters: PurchaseFilters = {},
): Promise<Purchase[]> {
  let query = supabase
    .from('purchases')
    .select('*')
    .order('purchase_date', { ascending: false });

  if (filters.fechaDesde) query = query.gte('purchase_date', filters.fechaDesde);
  if (filters.fechaHasta) query = query.lte('purchase_date', filters.fechaHasta);
  if (filters.proveedor) query = query.ilike('supplier_name', `%${filters.proveedor}%`);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    supplierName: (row.supplier_name as string) ?? '',
    invoiceNumber: (row.invoice_number as string) ?? null,
    total: row.total as number,
    notes: (row.notes as string) ?? null,
    status: (row.status as 'pending' | 'confirmed') ?? 'pending',
    purchaseDate: (row.purchase_date as string) ?? '',
    createdAt: (row.created_at as string) ?? '',
  }));
}

export async function getPurchaseById(
  id: string,
): Promise<(Purchase & { items: PurchaseItem[] }) | null> {
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .single();

  if (purchaseError) {
    if (purchaseError.code === 'PGRST116') return null;
    throw purchaseError;
  }

  const { data: items, error: itemsError } = await supabase
    .from('purchase_items')
    .select('*')
    .eq('purchase_id', id);

  if (itemsError) throw itemsError;

  const p = purchase as Record<string, unknown>;
  return {
    id: p.id as string,
    supplierName: (p.supplier_name as string) ?? '',
    invoiceNumber: (p.invoice_number as string) ?? null,
    total: p.total as number,
    notes: (p.notes as string) ?? null,
    status: (p.status as 'pending' | 'confirmed') ?? 'pending',
    purchaseDate: (p.purchase_date as string) ?? '',
    createdAt: (p.created_at as string) ?? '',
    items: ((items ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: item.id as string,
      purchaseId: (item.purchase_id as string) ?? '',
      productId: (item.product_id as string) ?? '',
      variantId: (item.variant_id as string) ?? null,
      quantity: item.quantity as number,
      unitCost: item.unit_cost as number,
      subtotal: item.subtotal as number,
    })),
  };
}

export interface CreatePurchaseInput {
  supplierName: string;
  invoiceNumber?: string | null;
  total: number;
  notes?: string | null;
  purchaseDate?: string;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitCost: number;
  }[];
}

export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<{ id: string }> {
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      supplier_name: input.supplierName,
      invoice_number: input.invoiceNumber ?? null,
      total: input.total,
      notes: input.notes ?? null,
      purchase_date: input.purchaseDate ?? new Date().toISOString().split('T')[0],
      status: 'pending',
    } as never)
    .select('id')
    .single<{ id: string }>();

  if (purchaseError) throw purchaseError;

  if (input.items.length > 0) {
    const purchaseItems = input.items.map((item) => ({
      purchase_id: purchase.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems as never);

    if (itemsError) throw itemsError;
  }

  return { id: purchase.id };
}

export async function confirmPurchase(id: string): Promise<void> {
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'confirmed' } as never)
    .eq('id', id);

  if (error) throw error;
}

// =============================================================================
// CASH MOVEMENTS
// =============================================================================

export interface CashMovementFilters {
  fechaDesde?: string;
  fechaHasta?: string;
}

export async function getCashMovements(
  filters: CashMovementFilters = {},
): Promise<CashMovement[]> {
  let query = supabase
    .from('cash_movements')
    .select('*')
    .order('movement_date', { ascending: false });

  if (filters.fechaDesde) query = query.gte('movement_date', filters.fechaDesde);
  if (filters.fechaHasta) query = query.lte('movement_date', filters.fechaHasta);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    type: row.type as CashMovement['type'],
    amount: row.amount as number,
    description: row.description as string,
    referenceType: (row.reference_type as string) ?? null,
    referenceId: (row.reference_id as string) ?? null,
    movementDate: (row.movement_date as string) ?? '',
    createdBy: (row.created_by as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
  }));
}

export async function getBalance(): Promise<number> {
  const { data, error } = await supabase
    .from('cash_movements')
    .select('type, amount');

  if (error) throw error;

  const movements = (data ?? []) as { type: string; amount: number }[];
  return movements.reduce((balance, m) => {
    return m.type === 'income'
      ? balance + Number(m.amount)
      : balance - Number(m.amount);
  }, 0);
}
