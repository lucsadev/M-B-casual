/**
 * CartScreen — Full cart screen for the mobile app.
 *
 * Route: (tabs)/carrito
 * Features:
 * - FlatList of cart items with image, name, variant, quantity stepper
 * - Pull-to-refresh
 * - Fixed bottom summary bar with totals and checkout CTA
 * - Empty state with link to catalog
 */
import { useCallback } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCart, useUpdateQty, useRemoveItem } from '../../features/cart/hooks/use-cart';
import { CartList } from '../../features/cart/components/cart-list';
import { CartSummarySheet } from '../../features/cart/components/cart-summary-sheet';

export default function CartScreen() {
  const router = useRouter();
  const { items, summary, isLoading, refetch } = useCart();
  const { mutate: updateQty, isPending: isUpdating } = useUpdateQty();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveItem();

  const busy = isUpdating || isRemoving;

  const handleIncrement = useCallback(
    (itemId: string, currentQty: number) => {
      updateQty({ itemId, quantity: currentQty + 1 });
    },
    [updateQty],
  );

  const handleDecrement = useCallback(
    (itemId: string, currentQty: number) => {
      if (currentQty > 1) {
        updateQty({ itemId, quantity: currentQty - 1 });
      }
    },
    [updateQty],
  );

  const handleCheckout = useCallback(() => {
    router.push('/checkout');
  }, [router]);

  return (
    <View className="flex-1 bg-[#FFFFFF]">
      <Stack.Screen options={{ title: 'Carrito' }} />

      <CartList
        items={items}
        isLoading={isLoading}
        isUpdating={busy}
        refreshing={false}
        onRefresh={refetch}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={(id) => removeItem(id)}
      />

      {items.length > 0 && (
        <CartSummarySheet
          summary={summary}
          onCheckout={handleCheckout}
        />
      )}
    </View>
  );
}
