import { z } from 'zod';

/**
 * Full purchase schema matching the Purchase interface.
 */
export const purchaseSchema = z.object({
  id: z.string().uuid(),
  supplierName: z.string().min(1, 'Supplier name is required'),
  invoiceNumber: z.string().optional(),
  total: z.number().min(0, 'Total must be non-negative'),
  notes: z.string().optional(),
  purchaseDate: z.string(),
  createdAt: z.string().datetime(),
});

/**
 * Full purchase item schema matching the PurchaseItem interface.
 */
export const purchaseItemSchema = z.object({
  id: z.string().uuid(),
  purchaseId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
});
