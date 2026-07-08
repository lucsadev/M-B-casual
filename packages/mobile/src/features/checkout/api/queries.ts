/**
 * Supabase query functions for the checkout domain (mobile).
 *
 * Mirrors the web queries in packages/web/src/features/checkout/api/queries.ts.
 */
import { supabase } from '../../../lib/supabase';
import type { CheckoutInput } from '@mbt/shared';

/**
 * Create an order from the current user's cart items.
 * Calls the Postgres RPC `create_order_from_cart`.
 */
export async function createOrder(
  input: CheckoutInput,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_order_from_cart', {
    p_shipping_address: input.shipping_address as unknown as Record<string, unknown>,
    p_payment_method: input.payment_method,
  });

  if (error) throw error;
  return data as string;
}
