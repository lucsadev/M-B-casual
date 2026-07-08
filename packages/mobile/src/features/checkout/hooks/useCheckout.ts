/**
 * useCheckout — TanStack Query mutation for order creation (mobile).
 *
 * Mirrors the web hook in packages/web/src/features/checkout/hooks/useCheckout.ts.
 * On success: invalidates cart queries and navigates to /orden/:orderId
 * On error: shows an alert with the error message
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import type { CheckoutInput } from '@mbt/shared';
import { createOrder } from '../api/queries';
import { CART_QUERY_KEY } from '../../cart/hooks/use-cart';

/**
 * Mutation hook to place an order from the current cart (mobile).
 */
export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CheckoutInput>({
    mutationFn: async (input) => {
      return createOrder(input);
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      router.replace(`/orden/${orderId}`);
    },
    onError: (error) => {
      Alert.alert(
        'Error al crear el pedido',
        error.message ?? 'Ocurrió un error al procesar tu pedido. Intentalo de nuevo.',
      );
    },
  });
}
