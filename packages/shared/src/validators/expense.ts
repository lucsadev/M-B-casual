import { z } from 'zod';

/**
 * Full expense schema matching the Expense interface.
 */
export const expenseSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  expenseDate: z.string(),
  receiptUrl: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});

/**
 * Input schema for creating a new expense.
 * Auto-generated fields (id, createdAt) are omitted.
 */
export const expenseCreateSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  expenseDate: z.string(),
  receiptUrl: z.string().optional(),
  createdBy: z.string().uuid().optional(),
});
