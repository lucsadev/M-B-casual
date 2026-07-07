import { z } from 'zod';

/**
 * Order status enum values matching the OrderStatus union type.
 */
const orderStatusValues = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

/**
 * Full order schema matching the Order interface.
 */
export const orderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  status: z.enum(orderStatusValues),
  total: z.number().min(0, 'Total must be non-negative'),
  shippingCost: z.number().min(0, 'Shipping cost must be non-negative'),
  discount: z.number().min(0, 'Discount must be non-negative'),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string(),
  notes: z.string().optional(),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Input schema for creating a new order.
 * Auto-generated fields (id, createdAt, updatedAt) are omitted.
 * Status defaults to 'pending'.
 */
export const orderCreateSchema = z.object({
  customerId: z.string().uuid(),
  status: z.enum(orderStatusValues).default('pending'),
  total: z.number().min(0, 'Total must be non-negative'),
  shippingCost: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().default('pending'),
  notes: z.string().optional(),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Full order item schema matching the OrderItem interface.
 */
export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
});
