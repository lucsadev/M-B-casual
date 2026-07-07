/**
 * Valid types for cash movements.
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
  /** What kind of record this references: 'order', 'expense', 'purchase', 'transfer' */
  referenceType?: string;
  /** UUID of the referenced record (order, expense, purchase, etc.) */
  referenceId?: string;
  /** Date of the movement */
  movementDate: string;
  /** Foreign key to `auth.users.id` — who created this */
  createdBy?: string;
  /** ISO timestamp of creation */
  createdAt: string;
}
