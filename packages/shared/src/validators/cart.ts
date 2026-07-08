import { z } from 'zod';

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable(),
  quantity: z.number().int().positive().max(99),
});

export const shippingAddressSchema = z.object({
  full_name: z.string().min(3, 'Nombre completo requerido'),
  street: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  state: z.string().min(2, 'Provincia requerida'),
  zip_code: z.string().min(3, 'Codigo postal requerido'),
  phone: z.string().min(7, 'Telefono requerido'),
  notes: z.string().optional(),
});

export const checkoutSchema = z.object({
  shipping_address: shippingAddressSchema,
  payment_method: z.enum(['transferencia', 'efectivo', 'mercado_pago']),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
