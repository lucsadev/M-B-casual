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

/**
 * Profile update schema for the edit-profile form.
 * All fields are optional — only submitted fields are updated.
 * firstName and lastName require at least 2 chars when provided.
 */
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional(),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .optional(),
  phone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .optional()
    .nullable(),
  address: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
