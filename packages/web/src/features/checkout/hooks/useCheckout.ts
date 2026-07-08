/**
 * useCheckout — TanStack Query mutation for order creation.
 *
 * Provides:
 * - useCheckout() → mutation that calls create_order_from_cart RPC
 *
 * On success: invalidates cart queries and redirects to /gracias/:orderId
 * On error: shows a toast with the error message
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { CheckoutInput } from '@mbt/shared';
import { createOrder } from '../api/queries';
import { CART_QUERY_KEY } from '@/features/cart/hooks/use-cart';

/**
 * Mutation hook to place an order from the current cart.
 *
 * Usage:
 * ```ts
 * const { mutate: checkout, isPending } = useCheckout();
 * checkout({ shipping_address: {...}, payment_method: 'transferencia' });
 * ```
 */
export function useCheckout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<string, Error, CheckoutInput>({
    mutationFn: async (input) => {
      return createOrder(input);
    },
    onSuccess: (orderId) => {
      // Invalidate cart so it re-fetches (empty cart after checkout)
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success('¡Pedido creado con éxito!');
      navigate(`/gracias/${orderId}`);
    },
    onError: (error) => {
      toast.error(error.message ?? 'Error al crear el pedido. Intentalo de nuevo.');
    },
  });
}
