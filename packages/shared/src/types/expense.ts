/**
 * Expense represents an operational cost (advertising, packaging, shipping, etc.).
 * Maps to the `expenses` table in Supabase.
 */
export interface Expense {
  /** UUID primary key */
  id: string;
  /** Description of the expense */
  description: string;
  /** Amount spent in ARS */
  amount: number;
  /** Expense category: 'publicidad', 'packaging', 'envío', etc. */
  category: string;
  /** Date the expense was incurred */
  expenseDate: string;
  /** URL to a photo of the receipt in Supabase Storage */
  receiptUrl?: string;
  /** Foreign key to `auth.users.id` — who recorded this */
  createdBy?: string;
  /** ISO timestamp of creation */
  createdAt: string;
}
