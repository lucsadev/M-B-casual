/**
 * Finance module types — Expenses, Purchases, Cash Movements & Dashboard KPIs.
 *
 * NOTE: CashMovement.type uses 'income'|'expense' to match the DB CHECK constraint
 * (cash_movements.type IN ('income', 'expense')). The frontend displays localized
 * labels ("Ingreso"/"Egreso") via a mapping function.
 */

// =============================================================================
// EXPENSES
// =============================================================================

/**
 * Valid expense categories for dropdown/validation.
 */
export type ExpenseCategory =
  | 'alquiler'
  | 'servicios'
  | 'sueldos'
  | 'marketing'
  | 'logistica'
  | 'otros';

/**
 * Expense represents an operational cost.
 * Maps to the `expenses` table in Supabase.
 */
export interface Expense {
  /** UUID primary key */
  id: string;
  /** Description of the expense */
  description: string;
  /** Amount spent in ARS */
  amount: number;
  /** Expense category */
  category: ExpenseCategory;
  /** Date the expense was incurred */
  expenseDate: string;
  /** URL to a photo of the receipt in Supabase Storage */
  receiptUrl: string | null;
  /** Foreign key to `auth.users.id` — who recorded this */
  createdBy: string | null;
  /** ISO timestamp of creation */
  createdAt: string;
}

// =============================================================================
// PURCHASES (supplier orders)
// =============================================================================

/**
 * Purchase represents a stock replenishment from a supplier.
 * Maps to the `purchases` table in Supabase.
 */
export interface Purchase {
  /** UUID primary key */
  id: string;
  /** Name of the supplier or vendor */
  supplierName: string;
  /** Supplier invoice or receipt number */
  invoiceNumber: string | null;
  /** Total cost of the purchase */
  total: number;
  /** Internal notes about the purchase */
  notes: string | null;
  /** Confirmation status — triggers stock update on 'confirmed' */
  status: 'pending' | 'confirmed';
  /** Date the purchase was made */
  purchaseDate: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** Line items (included in detail queries) */
  items?: PurchaseItem[];
}

/**
 * PurchaseItem represents a single product line within a purchase.
 * Maps to the `purchase_items` table in Supabase.
 */
export interface PurchaseItem {
  /** UUID primary key */
  id: string;
  /** Foreign key to `purchases.id` */
  purchaseId: string;
  /** Foreign key to `products.id` */
  productId: string;
  /** Foreign key to `product_variants.id` (null if no variant tracked) */
  variantId: string | null;
  /** Quantity of items purchased */
  quantity: number;
  /** Cost per unit */
  unitCost: number;
  /** Line total (quantity × unitCost) */
  subtotal: number;
}

// =============================================================================
// CASH MOVEMENTS
// =============================================================================

/**
 * Valid types for cash movements.
 * Matches the DB CHECK constraint: type IN ('income', 'expense').
 */
export type CashMovementType = 'income' | 'expense';

/**
 * CashMovement records every financial transaction in the cash register.
 * Maps to the `cash_movements` table in Supabase.
 */
export interface CashMovement {
  /** UUID primary key */
  id: string;
  /** Whether this is money coming in or going out */
  type: CashMovementType;
  /** Amount in ARS (positive for income, positive for expense — sign is in the type) */
  amount: number;
  /** Human-readable description of the movement */
  description: string;
  /** What kind of record this references: 'order', 'expense', 'purchase' */
  referenceType: string | null;
  /** UUID of the referenced record */
  referenceId: string | null;
  /** Date of the movement */
  movementDate: string;
  /** Foreign key to `auth.users.id` — who created this */
  createdBy: string | null;
  /** ISO timestamp of creation */
  createdAt: string;
}

// =============================================================================
// DASHBOARD KPIs
// =============================================================================

/**
 * DashboardKPI represents the monthly financial summary for the dashboard.
 */
export interface DashboardKPI {
  /** Total income from confirmed orders in the period */
  totalIngresos: number;
  /** Total expenses in the period */
  totalGastos: number;
  /** Gross margin (ingresos - gastos) */
  margenBruto: number;
  /** Number of confirmed orders in the period */
  cantidadOrdenes: number;
  /** Period label (e.g. "2026-07" or "Jul 2026") */
  periodo: string;
}
