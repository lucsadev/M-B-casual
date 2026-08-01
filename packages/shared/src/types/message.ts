/**
 * Message represents a notification sent from the seller/admin to a customer.
 * Maps to the `messages` table in Supabase.
 */
export interface Message {
  /** UUID primary key */
  id: string;
  /** Foreign key to customers.id */
  customerId: string;
  /** Optional foreign key to orders.id for context */
  orderId?: string;
  /** Message category: general, order_status, payment_status */
  type: 'general' | 'order_status' | 'payment_status';
  /** Short summary (e.g. "Pedido actualizado a Enviado") */
  title: string;
  /** Optional detailed message body */
  body?: string;
  /** Whether the customer has read this message */
  isRead: boolean;
  /** ISO timestamp of creation */
  createdAt: string;
}

/**
 * Input for creating a new message (admin only).
 */
export interface CreateMessageInput {
  customerId: string;
  orderId?: string;
  type?: 'general' | 'order_status' | 'payment_status';
  title: string;
  body?: string;
}
