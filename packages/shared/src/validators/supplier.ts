import { z } from 'zod';

/**
 * Full supplier schema matching the Supplier interface.
 */
export const supplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  website: z.string().optional(),
  instagram: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Input schema for creating/editing a supplier.
 * Auto-generated fields (id, createdAt, updatedAt) are omitted.
 *
 * The email field accepts an empty string from form inputs and normalizes
 * it to undefined so optional columns are stored as NULL.
 */
export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().optional(),
  instagram: z.string().optional(),
  email: z
    .union([z.string().email('Invalid email'), z.literal('')])
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});
