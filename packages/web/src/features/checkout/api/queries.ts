/**
 * Supabase query functions for the checkout domain.
 *
 * Encapsulates the create_order RPC call.
 */
import { supabase } from '@/lib/supabase';
import type { CheckoutInput } from '@mbt/shared';

type CreateOrderRpc = (
  fn: 'create_order_from_cart',
  args: {
    p_shipping_address: Record<string, unknown>;
    p_payment_method: CheckoutInput['payment_method'];
  },
) => Promise<{ data: string | null; error: Error | null }>;

async function notifyPendingOrder(orderId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('notify-sale-whatsapp', {
    body: { order_id: orderId },
  });

  if (error) {
    console.warn('Pending order WhatsApp notification failed', error);
  }
}

/**
 * Create an order from the current user's cart items.
 *
 * Calls the Postgres RPC `create_order_from_cart` which atomically:
 * 1. Creates an `orders` row
 * 2. Creates `order_items` rows from cart_items
 * 3. Deletes cart_items for the user
 *
 * @returns The UUID of the newly created order
 */
export async function createOrder(
  input: CheckoutInput,
): Promise<string> {
  const createOrderRpc = supabase.rpc.bind(supabase) as unknown as CreateOrderRpc;
  const { data, error } = await createOrderRpc('create_order_from_cart', {
    p_shipping_address: input.shipping_address as unknown as Record<string, unknown>,
    p_payment_method: input.payment_method,
  });

  if (error) throw error;
  if (!data) throw new Error('No se pudo crear la orden.');

  void notifyPendingOrder(data);

  return data as string;
}
