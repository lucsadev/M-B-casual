/**
 * Finance API queries — raw Supabase query functions.
 *
 * Separated from hooks to allow direct use in non-React contexts
 * (e.g. loaders, effects, server-side).
 *
 * All functions throw on error — callers handle via try/catch or
 * TanStack Query's error boundary.
 */
import { supabase } from '@/lib/supabase';
import type {
  CashMovement,
  DashboardKPI,
  Expense,
  ExpenseCategory,
  Purchase,
  PurchaseItem,
} from '@mbt/shared';

// =============================================================================
// DASHBOARD KPIs
// =============================================================================

export interface DashboardKPIFilters {
  fechaDesde: string;
  fechaHasta: string;
}

/**
 * Aggregates dashboard KPIs for a date range:
 * - total income (SUM of confirmed orders)
 * - total expenses (SUM of expenses)
 * - gross margin
 * - order count
 */
export async function getDashboardKPI(
  filters: DashboardKPIFilters,
): Promise<DashboardKPI> {
  const { fechaDesde, fechaHasta } = filters;

  // Income: confirmed orders in range
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'confirmed')
    .gte('created_at', fechaDesde)
    .lte('created_at', fechaHasta);

  if (ordersError) throw ordersError;

  const totalIngresos =
    (ordersData as { total: number }[] ?? []).reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

  const cantidadOrdenes = (ordersData ?? []).length;

  // Expenses in range
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', fechaDesde)
    .lte('expense_date', fechaHasta);

  if (expensesError) throw expensesError;

  const totalGastos =
    (expensesData as { amount: number }[] ?? []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
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
// EXPENSES
// =============================================================================

export interface ExpenseFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: ExpenseCategory;
}

/**
 * Fetch paginated expenses with optional date range and category filter.
 */
export async function getExpenses(
  filters: ExpenseFilters = {},
): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (filters.fechaDesde) {
    query = query.gte('expense_date', filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    query = query.lte('expense_date', filters.fechaHasta);
  }
  if (filters.categoria) {
    query = query.eq('category', filters.categoria);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as unknown as Expense[];
}

/**
 * Fetch a single expense by ID.
 */
export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }

  return data as unknown as Expense;
}

/** Input shape for creating an expense */
export interface CreateExpenseInput {
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate?: string;
  receiptUrl?: string | null;
}

/**
 * Create a new expense.
 */
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

/** Input shape for updating an expense */
export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  expenseDate?: string;
  receiptUrl?: string | null;
}

/**
 * Update an existing expense.
 */
export async function updateExpense(
  id: string,
  input: UpdateExpenseInput,
): Promise<void> {
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

/**
 * Delete an expense by ID.
 */
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

/**
 * Fetch purchases with optional filters.
 */
export async function getPurchases(
  filters: PurchaseFilters = {},
): Promise<Purchase[]> {
  let query = supabase
    .from('purchases')
    .select('*')
    .order('purchase_date', { ascending: false });

  if (filters.fechaDesde) {
    query = query.gte('purchase_date', filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    query = query.lte('purchase_date', filters.fechaHasta);
  }
  if (filters.proveedor) {
    query = query.ilike('supplier_name', `%${filters.proveedor}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as unknown as Purchase[];
}

/**
 * Fetch a single purchase with its line items.
 */
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

  return {
    ...(purchase as unknown as Purchase),
    items: (items ?? []) as unknown as PurchaseItem[],
  };
}

/** Input shape for creating a purchase */
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

/**
 * Create a purchase with its line items in a single operation.
 */
export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<{ id: string }> {
  // Insert purchase row
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      supplier_name: input.supplierName,
      invoice_number: input.invoiceNumber ?? null,
      total: input.total,
      notes: input.notes ?? null,
      purchase_date:
        input.purchaseDate ?? new Date().toISOString().split('T')[0],
      status: 'pending',
    } as never)
    .select('id')
    .single<{ id: string }>();

  if (purchaseError) throw purchaseError;

  // Insert purchase items
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

/**
 * Confirm a purchase — sets status to 'confirmed', which triggers
 * the DB trigger `trg_purchase_confirm_stock` to update variant stock.
 */
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

/**
 * Fetch cash movements ordered by movement_date descending.
 */
export async function getCashMovements(
  filters: CashMovementFilters = {},
): Promise<CashMovement[]> {
  let query = supabase
    .from('cash_movements')
    .select('*')
    .order('movement_date', { ascending: false });

  if (filters.fechaDesde) {
    query = query.gte('movement_date', filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    query = query.lte('movement_date', filters.fechaHasta);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as unknown as CashMovement[];
}

/**
 * Compute the current balance from all cash movements.
 * Balance = SUM(income amounts) - SUM(expense amounts).
 */
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
