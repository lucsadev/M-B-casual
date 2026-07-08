/**
 * Supabase query functions for the checkout domain.
 *
 * Encapsulates the create_order RPC call.
 */
import { supabase } from '@/lib/supabase';
import type { CheckoutInput } from '@mbt/shared';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_order_from_cart', {
    p_shipping_address: input.shipping_address as unknown as Record<string, unknown>,
    p_payment_method: input.payment_method,
  });

  if (error) throw error;
  return data as string;
}
