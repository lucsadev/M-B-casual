/**
 * CartSummarySheet — Fixed bottom summary bar for the cart screen.
 *
 * Shows item count, subtotal, shipping, and total with a
 * "Continuar al checkout" button. Renders as a fixed footer
 * pinned to the bottom of the screen (not an actual bottom sheet,
 * since @gorhom/bottom-sheet is not installed).
 */
import { View, Text, TouchableOpacity } from 'react-native';
import type { CartSummary } from '@mbt/shared';

interface CartSummarySheetProps {
  summary: CartSummary;
  onCheckout: () => void;
}

export function CartSummarySheet({ summary, onCheckout }: CartSummarySheetProps) {
  return (
    <View className="border-t border-[#E8E4D9] bg-[#FFFFFF] px-4 py-4 pb-8">
      {/* Totals */}
      <View className="space-y-1.5 mb-4">
        <View className="flex-row justify-between">
          <Text className="text-sm text-[#1A1A1A]/60">Subtotal</Text>
          <Text className="text-sm text-[#1A1A1A]/60">
            ${summary.subtotal.toLocaleString('es-AR')}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-[#1A1A1A]/60">Envío</Text>
          <Text className="text-sm text-[#1A1A1A]/60">
            {summary.shipping_cost === 0 ? 'Gratis' : `$${summary.shipping_cost.toLocaleString('es-AR')}`}
          </Text>
        </View>
        <View className="flex-row justify-between pt-1 border-t border-[#E8E4D9] mt-1">
          <Text className="text-base font-bold text-[#1A1A1A]">Total</Text>
          <Text className="text-base font-bold text-[#1A1A1A]">
            ${summary.total.toLocaleString('es-AR')}
          </Text>
        </View>
      </View>

      {/* Checkout button */}
      <TouchableOpacity
        onPress={onCheckout}
        className="w-full rounded-md bg-[#D4A853] py-3.5 items-center"
        accessibilityLabel="Continuar al checkout"
      >
        <Text className="text-sm font-bold text-white">
          Continuar al checkout
        </Text>
      </TouchableOpacity>
    </View>
  );
}
