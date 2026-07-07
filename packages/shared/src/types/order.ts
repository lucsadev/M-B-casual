/**
 * Valid states for an order lifecycle.
 * Maps to the `order_status` PostgreSQL enum.
 */
export type OrderStatus =
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Order represents a customer's purchase transaction.
 * Maps to the `orders` table in Supabase.
 */
export interface Order {
  /** UUID primary key */
  id: string;
  /** Foreign key to `customers.id` */
  customerId: string;
  /** Current status in the fulfillment lifecycle */
  status: OrderStatus;
  /** Grand total paid by the customer (items + shipping - discount) */
  total: number;
  /** Shipping cost amount */
  shippingCost: number;
  /** Discount applied to the order */
  discount: number;
  /** Payment method used: 'transferencia', 'efectivo', 'mp' */
  paymentMethod?: string;
  /** Payment resolution status */
  paymentStatus: string;
  /** Internal notes about the order */
  notes?: string;
  /** Shipping address as JSON object */
  shippingAddress?: Record<string, unknown>;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * OrderItem represents a single product line within an order.
 * Maps to the `order_items` table in Supabase.
 */
export interface OrderItem {
  /** UUID primary key */
  id: string;
  /** Foreign key to `orders.id` */
  orderId: string;
  /** Foreign key to `products.id` */
  productId: string;
  /** Foreign key to `product_variants.id` (optional) */
  variantId?: string;
  /** Quantity of this item purchased */
  quantity: number;
  /** Price per unit at time of purchase */
  unitPrice: number;
  /** Line total (quantity × unitPrice) */
  subtotal: number;
}
