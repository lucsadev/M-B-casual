/**
 * OrderSummary — Read-only summary of cart items and totals for mobile checkout.
 *
 * Mirrors the web OrderSummary component.
 */
import { View, Text, Image, ScrollView } from 'react-native';
import type { CartItem, CartSummary } from '@mbt/shared';
import { formatPrice } from '@mbt/shared';

interface OrderSummaryProps {
  items: CartItem[];
  summary: CartSummary;
}

export function OrderSummary({ items, summary }: OrderSummaryProps) {
  return (
    <View className="rounded-lg border border-[#E8E4D9] bg-white p-4">
      <Text className="mb-3 text-base font-bold text-[#1A1A1A]">
        Resumen del pedido
      </Text>

      {/* Items list */}
      {items.map((item) => (
        <View
          key={item.id}
          className="flex-row items-start gap-3 border-b border-[#E8E4D9] py-3"
        >
          <View className="h-12 w-12 overflow-hidden rounded-md bg-[#F5F5F0]">
            <Image
              source={{
                uri: item.product_image ?? 'https://placehold.co/200x200/F5F5F0/1A1A1A?text=Sin+imagen',
              }}
              className="h-full w-full"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1">
            <Text className="text-sm font-medium text-[#1A1A1A]" numberOfLines={1}>
              {item.product_name}
            </Text>
            {item.variant_label && (
              <Text className="text-xs text-[#1A1A1A]/50">
                {item.variant_label}
              </Text>
            )}
            <View className="flex-row items-center justify-between mt-0.5">
              <Text className="text-xs text-[#1A1A1A]/60">
                x{item.quantity}
              </Text>
              <Text className="text-sm font-medium text-[#1A1A1A]">
                {formatPrice(item.unit_price * item.quantity)}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Totals */}
      <View className="mt-3 gap-1.5">
        <View className="flex-row justify-between">
          <Text className="text-sm text-[#1A1A1A]/60">
            Subtotal ({summary.item_count} productos)
          </Text>
          <Text className="text-sm text-[#1A1A1A]/60">
            {formatPrice(summary.subtotal)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-[#1A1A1A]/60">Envío</Text>
          <Text className="text-sm text-[#1A1A1A]/60">
            {summary.shipping_cost === 0 ? 'Gratis' : formatPrice(summary.shipping_cost)}
          </Text>
        </View>
        {summary.discount > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-sm text-emerald-600">Descuento</Text>
            <Text className="text-sm text-emerald-600">
              -{formatPrice(summary.discount)}
            </Text>
          </View>
        )}
        <View className="flex-row justify-between border-t border-[#E8E4D9] pt-2">
          <Text className="text-base font-bold text-[#1A1A1A]">Total</Text>
          <Text className="text-base font-bold text-[#1A1A1A]">
            {formatPrice(summary.total)}
          </Text>
        </View>
      </View>
    </View>
  );
}
