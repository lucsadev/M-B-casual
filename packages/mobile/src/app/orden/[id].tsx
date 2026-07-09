/**
 * OrderConfirmationScreen — Success screen after order placement (mobile).
 *
 * Expo Router route: /orden/:id
 *
 * Displays:
 * - Success checkmark
 * - Order number
 * - Purchased items summary
 * - Order total + payment method
 * - Order status badge
 * - "Volver al catálogo" button
 */
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatPrice, ORDER_STATUS } from '@mbt/shared';

interface OrderRow {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  shipping_cost: number;
  discount: number;
  payment_method: string | null;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
}

function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single<OrderRow>();

      if (orderError) throw orderError;
      if (!order) throw new Error('Orden no encontrada');

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          subtotal,
          product:product_id (
            name,
            images
          )
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      return { order, items: items ?? [] };
    },
    enabled: !!id,
  });
}

function getStatusLabel(status: string): string {
  const found = ORDER_STATUS.find((s) => s.value === status);
  return found?.label ?? status;
}

function getStatusDescription(status: string): string {
  const found = ORDER_STATUS.find((s) => s.value === status);
  return found?.description ?? '';
}

export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useOrder(id ?? '');

  // Loading
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Pedido confirmado', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4A853" />
        </View>
      </View>
    );
  }

  // Error
  if (isError || !data) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Pedido confirmado', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-xl font-bold text-[#1A1A1A] mb-2">
            Orden no encontrada
          </Text>
          <Text className="text-sm text-[#1A1A1A]/60 text-center mb-6">
            La orden que buscás no existe o no tenés acceso a ella.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/catalogo')}
            className="bg-[#D4A853] px-6 py-2.5 rounded-md"
          >
            <Text className="text-white font-medium text-sm">
              Volver al catálogo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { order, items } = data;
  const orderNum = order.id.substring(0, 8).toUpperCase();
  const paymentMethodLabels: Record<string, string> = {
    transferencia: 'Transferencia Bancaria',
    efectivo: 'Efectivo',
    mercado_pago: 'Mercado Pago',
    mp: 'Mercado Pago',
  };

  return (
    <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
      <Stack.Screen
        options={{
          title: 'Pedido confirmado',
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success header */}
        <View className="items-center mb-8">
          <View className="h-16 w-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
            <Text className="text-3xl text-emerald-600">✓</Text>
          </View>
          <Text className="text-xl font-bold text-[#1A1A1A] mb-1">
            ¡Pedido confirmado!
          </Text>
          <Text className="text-sm text-[#1A1A1A]/60 text-center">
            Gracias por tu compra. Te notificaremos cuando el pedido sea procesado.
          </Text>
        </View>

        {/* Order number + status */}
        <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                Número de orden
              </Text>
              <Text className="text-lg font-bold text-[#1A1A1A] font-mono">
                #{orderNum}
              </Text>
            </View>
            <View className="bg-amber-100 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-medium text-amber-800">
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-[#1A1A1A]/60">
            {getStatusDescription(order.status)}
          </Text>
        </View>

        {/* Purchased items */}
        <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
          <Text className="text-base font-bold text-[#1A1A1A] mb-3">
            Productos comprados
          </Text>

          {(items as Array<{
            id: string;
            quantity: number;
            unit_price: number;
            subtotal: number;
            product?: { name: string; images: string[] };
          }>).map((item) => (
            <View
              key={item.id}
              className="flex-row items-start gap-3 border-b border-[#E8E4D9] py-3"
            >
              <View className="h-12 w-12 overflow-hidden rounded-md bg-[#F5F5F0]">
                <Image
                  source={{
                    uri: item.product?.images?.[0] ?? 'https://placehold.co/200x200/F5F5F0/1A1A1A?text=Sin+imagen',
                  }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-[#1A1A1A]">
                  {item.product?.name ?? 'Producto'}
                </Text>
                <View className="flex-row items-center justify-between mt-0.5">
                  <Text className="text-xs text-[#1A1A1A]/60">
                    {item.quantity} x {formatPrice(item.unit_price)}
                  </Text>
                  <Text className="text-sm font-medium text-[#1A1A1A]">
                    {formatPrice(item.subtotal)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-6">
          <Text className="text-base font-bold text-[#1A1A1A] mb-3">
            Resumen
          </Text>

          <View className="gap-1.5">
            <View className="flex-row justify-between">
              <Text className="text-sm text-[#1A1A1A]/60">Subtotal</Text>
              <Text className="text-sm text-[#1A1A1A]/60">
                {formatPrice(order.total - order.shipping_cost + order.discount)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-[#1A1A1A]/60">Envío</Text>
              <Text className="text-sm text-[#1A1A1A]/60">
                {order.shipping_cost === 0 ? 'Gratis' : formatPrice(order.shipping_cost)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-emerald-600">Descuento</Text>
                <Text className="text-sm text-emerald-600">
                  -{formatPrice(order.discount)}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between border-t border-[#E8E4D9] pt-2">
              <Text className="text-base font-bold text-[#1A1A1A]">Total</Text>
              <Text className="text-base font-bold text-[#1A1A1A]">
                {formatPrice(order.total)}
              </Text>
            </View>
          </View>

          <View className="mt-3 pt-3 border-t border-[#E8E4D9]">
            <View className="flex-row justify-between">
              <Text className="text-sm text-[#1A1A1A]/60">Método de pago</Text>
              <Text className="text-sm font-medium text-[#1A1A1A]">
                {paymentMethodLabels[order.payment_method ?? ''] ?? order.payment_method ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/catalogo')}
          className="bg-[#D4A853] py-3 rounded-md items-center"
        >
          <Text className="text-white font-semibold text-base">
            Volver al catálogo
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
