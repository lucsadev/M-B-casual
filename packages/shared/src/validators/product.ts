import { z } from 'zod';

/**
 * Full product schema matching the Product interface.
 * Validates data coming FROM the database.
 */
export const productSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  comparePrice: z.number().min(0).optional(),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Input schema for creating a new product.
 * Auto-generated fields (id, slug, createdAt, updatedAt) are omitted.
 */
export const productCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  comparePrice: z.number().min(0).optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

/**
 * Full product variant schema matching the ProductVariant interface.
 */
export const productVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  sku: z.string().optional(),
  createdAt: z.string().datetime(),
});
