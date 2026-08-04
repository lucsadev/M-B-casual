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
  cost: z.number().min(0).optional(),
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
  cost: z.number().min(0).optional(),
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
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  sku: z.string().optional(),
  createdAt: z.string().datetime(),
});

/**
 * Schema that every `generateSku` output MUST conform to.
 *
 * Format: `{cat}-{product}-{SIZE}(-{COLOR3})-{NNN}` where SIZE is uppercase
 * alphanumeric, COLOR3 is an optional 3-letter uppercase segment, and NNN is a
 * 3-digit ordinal. The `sku text unique` DB constraint is the binding guard.
 */
export const skuStringSchema = z.string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*-[A-Z0-9]+(?:-[A-Z]{3})?-\d{3}$/);

/**
 * Input schema for creating a new product variant.
 *
 * SKU is OPTIONAL and ignored on create — it is auto-generated downstream by
 * `generateSku`. The `sku` field is carried only so existing SKUs survive an
 * upsert-by-variant flow (matching on `id`), never to be manually entered.
 */
export const productVariantCreateSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  discount: z.number().int().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional(),
});
