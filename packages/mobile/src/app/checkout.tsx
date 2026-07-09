/**
 * CheckoutScreen — Mobile checkout screen.
 *
 * Route: /checkout
 * Features:
 * - Auth guard: redirects to /login with returnUrl if not authenticated
 * - Shipping form (react-hook-form + Zod)
 * - Payment method selector
 * - Order summary (read-only)
 * - "Confirmar orden" button with loading state
 * - Error handling
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PAYMENT_METHODS, type PaymentMethodId, type ShippingAddressInput } from '@mbt/shared';
import { useAuth } from '../features/auth/context/AuthContext';
import { useCart } from '../features/cart/hooks/use-cart';
import { useCheckout } from '../features/checkout/hooks/useCheckout';
import { ShippingForm } from '../features/checkout/components/shipping-form';
import { OrderSummary } from '../features/checkout/components/order-summary';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { items, summary, isLoading: isCartLoading } = useCart();

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace(`/login?returnUrl=/checkout`);
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || !user) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4A853" />
        </View>
      </View>
    );
  }
  const { mutate: checkout, isPending: isCheckingOut } = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('transferencia');
  const [shippingData, setShippingData] = useState<ShippingAddressInput | null>(null);

  const handleShippingSubmit = useCallback((data: ShippingAddressInput) => {
    setShippingData(data);
  }, []);

  const handleConfirmOrder = useCallback(() => {
    if (!shippingData) {
      Alert.alert('Datos incompletos', 'Completá los datos de envío antes de confirmar.');
      return;
    }

    checkout({
      shipping_address: shippingData,
      payment_method: paymentMethod,
    });
  }, [shippingData, paymentMethod, checkout]);

  // Loading
  if (isCartLoading) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4A853" />
        </View>
      </View>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-xl font-bold text-[#1A1A1A] mb-2">
            Tu carrito está vacío
          </Text>
          <Text className="text-sm text-[#1A1A1A]/60 text-center mb-6">
            Agregá productos al carrito antes de iniciar el checkout.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#D4A853] px-6 py-2.5 rounded-md"
          >
            <Text className="text-white font-medium text-sm">
              Volver al carrito
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Atrás' }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xl font-bold text-[#1A1A1A] mb-6">
          Completá tus datos
        </Text>

        {/* Shipping form */}
        <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
          <Text className="text-base font-bold text-[#1A1A1A] mb-4">
            Datos de envío
          </Text>
          <ShippingForm onSubmit={handleShippingSubmit} />
        </View>

        {/* Payment method */}
        <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
          <Text className="text-base font-bold text-[#1A1A1A] mb-3">
            Método de pago
          </Text>
          <View className="gap-2">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setPaymentMethod(method.id)}
                className={`flex-row items-center gap-3 rounded-md border px-4 py-3 ${
                  paymentMethod === method.id
                    ? 'border-[#D4A853] bg-[#D4A853]/5'
                    : 'border-[#E8E4D9] bg-white'
                }`}
              >
                <View
                  className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                    paymentMethod === method.id
                      ? 'border-[#D4A853]'
                      : 'border-[#1A1A1A]/30'
                  }`}
                >
                  {paymentMethod === method.id && (
                    <View className="h-3 w-3 rounded-full bg-[#D4A853]" />
                  )}
                </View>
                <Text className="text-sm font-medium text-[#1A1A1A]">
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order summary */}
        <OrderSummary items={items} summary={summary} />
      </ScrollView>

      {/* Fixed bottom bar with confirm button */}
      <View
        className="bg-white border-t border-[#E8E4D9] px-4 py-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={isCheckingOut || !shippingData}
          className={`w-full py-3.5 rounded-md items-center ${
            isCheckingOut || !shippingData
              ? 'bg-neutral-300'
              : 'bg-[#D4A853] active:bg-[#D4A853]/80'
          }`}
        >
          {isCheckingOut ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-semibold text-base">
                Procesando...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-base">
              Confirmar orden
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
