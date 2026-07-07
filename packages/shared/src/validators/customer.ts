import { z } from 'zod';

/**
 * Full customer schema matching the Customer interface.
 */
export const customerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

/**
 * Input schema for creating a new customer.
 * Auto-generated fields (id, createdAt) are omitted.
 */
export const customerCreateSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});
