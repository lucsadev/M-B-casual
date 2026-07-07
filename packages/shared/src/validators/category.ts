import { z } from 'zod';

/**
 * Full category schema matching the Category interface.
 */
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
});

/**
 * Input schema for creating a new category.
 * Auto-generated fields (id, slug, createdAt) are omitted.
 */
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
});
