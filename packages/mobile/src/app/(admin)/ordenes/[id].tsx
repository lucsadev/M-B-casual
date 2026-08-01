import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Select from '../../../components/Select';
import {
  useAdminOrder,
  useUpdateOrderStatus,
  getOrderStatusLabel,
} from '../../../features/admin/api/use-admin-orders';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'En preparación' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

function formatAddress(addr: unknown): string {
  if (typeof addr !== 'object' || addr === null) return String(addr ?? '');
  const a = addr as Record<string, string>;
  const parts = [
    a.street || '',
    a.city || '',
    a.state || '',
    a.zip_code || a.zip || '',
  ];
  return parts.filter(Boolean).join(', ');
}

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'refunded', label: 'Reembolsado' },
  { value: 'cancelled', label: 'Cancelado' },
];

function paymentStatusLabel(status: string | null | undefined): string {
  return PAYMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? '—';
}

function paymentBadgeStyle(status: string | null | undefined): { bg: string; text: string } {
  switch (status) {
    case 'paid':     return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'refunded': return { bg: 'bg-purple-50', text: 'text-purple-700' };
    case 'cancelled':return { bg: 'bg-red-50', text: 'text-red-700' };
    default:         return { bg: 'bg-amber-50', text: 'text-amber-700' };
  }
}

function statusBadgeStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'confirmed':  return { bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'processing': return { bg: 'bg-amber-50', text: 'text-amber-700' };
    case 'shipped':    return { bg: 'bg-purple-50', text: 'text-purple-700' };
    case 'delivered':  return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'cancelled':  return { bg: 'bg-red-50', text: 'text-red-700' };
    default:           return { bg: 'bg-gray-50', text: 'text-gray-700' };
  }
}

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError } = useAdminOrder(id ?? '');
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Text className="text-lg font-bold text-[#1A1A1A] mb-2">Pedido no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#D4A853] font-medium">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdateStatus = (newStatus: string) => {
    if (newStatus === order.status) return;
    Alert.alert(
      'Cambiar estado',
      `¿Cambiar estado a "${getOrderStatusLabel(newStatus)}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setSelectedStatus(''),
        },
        {
          text: 'Confirmar',
          onPress: () => {
            updateStatus({ id: order.id, status: newStatus });
          },
        },
      ],
    );
  };

  const handleUpdatePaymentStatus = (newStatus: string) => {
    if (newStatus === order.paymentStatus) return;
    Alert.alert(
      'Actualizar pago',
      `¿Cambiar estado de pago a "${paymentStatusLabel(newStatus)}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setSelectedPaymentStatus(''),
        },
        {
          text: 'Confirmar',
          onPress: () => {
            updateStatus({ id: order.id, status: order.status, payment_status: newStatus });
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="p-4 gap-6">
        {/* Status */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Estado actual
          </Text>
          <View className="rounded-lg border border-[#E2E2DC] bg-white p-4 gap-3">
            {/* Current status badge */}
            <View className="flex-row items-center gap-2">
              <View className={`px-3 py-1 rounded-full ${statusBadgeStyle(order.status).bg}`}>
                <Text className={`text-xs font-semibold ${statusBadgeStyle(order.status).text}`}>
                  {getOrderStatusLabel(order.status)}
                </Text>
              </View>
              {isUpdating && (
                <ActivityIndicator size="small" color="#1A1A1A" />
              )}
            </View>

            {/* Status changer */}
            <Select
              label="Cambiar estado"
              value={selectedStatus || order.status}
              onChange={(newStatus) => {
                setSelectedStatus(newStatus);
                handleUpdateStatus(newStatus);
              }}
              options={STATUS_OPTIONS}
              placeholder={getOrderStatusLabel(order.status)}
            />
          </View>
        </View>

        {/* Payment */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Pago
          </Text>
          <View className="rounded-lg border border-[#E2E2DC] bg-white p-4 gap-3">
            {/* Method + Status row */}
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-[#1A1A1A]/60">Método</Text>
              <Text className="text-sm font-medium capitalize">
                {order.paymentMethod ?? '—'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-[#1A1A1A]/60">Estado</Text>
              <View className={`px-3 py-1 rounded-full ${paymentBadgeStyle(order.paymentStatus).bg}`}>
                <Text className={`text-xs font-semibold ${paymentBadgeStyle(order.paymentStatus).text}`}>
                  {paymentStatusLabel(order.paymentStatus)}
                </Text>
              </View>
            </View>

            {/* Payment status changer */}
            <Select
              label="Actualizar estado de pago"
              value={selectedPaymentStatus || order.paymentStatus || ''}
              onChange={(newStatus) => {
                setSelectedPaymentStatus(newStatus);
                handleUpdatePaymentStatus(newStatus);
              }}
              options={PAYMENT_STATUS_OPTIONS}
              placeholder={paymentStatusLabel(order.paymentStatus)}
            />
          </View>
        </View>

        {/* Customer */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Cliente
          </Text>
          <View className="rounded-lg border border-[#E2E2DC] bg-white p-4">
            <Text className="text-sm font-medium text-[#1A1A1A]">
              {order.customer_name ?? 'Sin nombre'}
            </Text>
            {order.customer_phone && (
              <Text className="text-sm text-[#1A1A1A]/60 mt-1">{order.customer_phone}</Text>
            )}
            {order.shippingAddress && (
              <Text className="text-sm text-[#1A1A1A]/60 mt-1">
                {typeof order.shippingAddress === 'object'
                  ? formatAddress(order.shippingAddress)
                  : order.shippingAddress}
              </Text>
            )}
          </View>
        </View>

        {/* Items */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Items ({order.items.length})
          </Text>
          <View className="gap-2">
            {order.items.map((item) => (
              <View
                key={item.id}
                className="rounded-lg border border-[#E2E2DC] bg-white p-3"
              >
                <Text className="text-sm font-medium text-[#1A1A1A]">
                  {item.product_name}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                  {item.variant?.size && (
                    <Text className="text-xs text-[#1A1A1A]/60">Talle: {item.variant.size}</Text>
                  )}
                  {item.variant?.color && (
                    <View className="flex-row items-center gap-1">
                      {item.variant.color_hex && (
                        <View
                          className="w-3 h-3 rounded-full border border-[#E2E2DC]"
                          style={{ backgroundColor: item.variant.color_hex }}
                        />
                      )}
                      <Text className="text-xs text-[#1A1A1A]/60">{item.variant.color}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-xs text-[#1A1A1A]/40">
                    {item.quantity} x ${item.unitPrice.toLocaleString('es-AR')}
                  </Text>
                  <Text className="text-xs font-bold text-[#1A1A1A]">
                    ${item.subtotal.toLocaleString('es-AR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment / Summary */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Resumen
          </Text>
          <View className="rounded-lg border border-[#E2E2DC] bg-white p-4 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-[#1A1A1A]/60">Subtotal</Text>
              <Text className="text-sm text-[#1A1A1A]">
                ${order.total.toLocaleString('es-AR')}
              </Text>
            </View>
            {order.shippingCost != null && order.shippingCost > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-[#1A1A1A]/60">Envío</Text>
                <Text className="text-sm text-[#1A1A1A]">
                  ${order.shippingCost.toLocaleString('es-AR')}
                </Text>
              </View>
            )}
            {order.discount != null && order.discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-[#1A1A1A]/60">Descuento</Text>
                <Text className="text-sm text-green-600">
                  -${order.discount.toLocaleString('es-AR')}
                </Text>
              </View>
            )}
            <View className="border-t border-[#E2E2DC] pt-2 flex-row justify-between">
              <Text className="text-sm font-bold text-[#1A1A1A]">Total</Text>
              <Text className="text-sm font-bold text-[#1A1A1A]">
                ${order.total.toLocaleString('es-AR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View>
            <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
              Notas
            </Text>
            <View className="rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Text className="text-sm text-[#1A1A1A]/70">{order.notes}</Text>
            </View>
          </View>
        )}

        <Text className="text-xs text-[#1A1A1A]/40 text-center">
          Creado: {new Date(order.createdAt).toLocaleString('es-AR')}
        </Text>
      </View>
    </ScrollView>
  );
}
