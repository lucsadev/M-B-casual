import { z } from 'zod';

/**
 * Cash movement type enum matching the CashMovementType union type.
 */
const cashMovementTypeValues = ['income', 'expense'] as const;

/**
 * Full cash movement schema matching the CashMovement interface.
 */
export const cashMovementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(cashMovementTypeValues),
  amount: z.number().min(0, 'Amount must be non-negative'),
  description: z.string().min(1, 'Description is required'),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  movementDate: z.string(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
