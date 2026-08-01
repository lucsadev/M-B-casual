import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminOrders, getOrderStatusLabel } from '../../../features/admin/api/use-admin-orders';
import type { AdminOrdersFilters } from '../../../features/admin/api/use-admin-orders';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'processing', label: 'En proceso' },
  { value: 'shipped', label: 'Enviadas' },
  { value: 'delivered', label: 'Entregadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  confirmed: 'text-blue-600 bg-blue-100',
  processing: 'text-blue-600 bg-blue-100',
  shipped: 'text-purple-600 bg-purple-100',
  delivered: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100',
};

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filters: AdminOrdersFilters = { status, search, page, pageSize: 20 };
  const { data, isLoading } = useAdminOrders(filters);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Pedidos</Text>
        <Text className="mt-1 text-sm text-[#1A1A1A]/60">
          Gestioná los pedidos de los clientes.
        </Text>
      </View>

      <View className="px-4 mb-3">
        <TextInput
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          placeholder="Buscar por ID..."
          className="w-full rounded-md border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => { setStatus(opt.value); setPage(1); }}
            className={`px-4 py-2 rounded-full ${
              status === opt.value ? 'bg-[#1A1A1A]' : 'bg-white border border-[#E2E2DC]'
            }`}
          >
            <Text className={`text-sm font-medium ${status === opt.value ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && (
        <View className="px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-20 rounded-md bg-[#F0F0EC]" />
          ))}
        </View>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <View className="px-4 gap-3">
          {data.data.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() =>
                router.push({
                  pathname: '/(admin)/ordenes/[id]',
                  params: { id: order.id },
                })
              }
              className="rounded-lg border border-[#E2E2DC] bg-white p-4 active:bg-[#F0F0EC]"
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-sm font-semibold text-[#1A1A1A]">
                  #{order.id.slice(0, 8)}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-neutral-100'}`}>
                  <Text className="text-[10px] font-bold">
                    {getOrderStatusLabel(order.status)}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-[#1A1A1A]/60 mb-1">
                {order.customer_name ?? 'Cliente'}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-[#1A1A1A]/40">
                  {order.item_count} items · {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </Text>
                <Text className="text-sm font-bold text-[#1A1A1A]">
                  ${order.total.toLocaleString('es-AR')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isLoading && (!data || data.data.length === 0) && (
        <View className="mx-4 items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <Text className="text-sm text-[#1A1A1A]/50">No hay pedidos.</Text>
        </View>
      )}

      {data && data.totalPages > 1 && (
        <View className="flex-row justify-center items-center gap-4 px-4 mt-6">
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`px-4 py-2 rounded-md ${page <= 1 ? 'bg-neutral-200' : 'bg-[#1A1A1A]'}`}
          >
            <Text className={`text-sm font-medium ${page <= 1 ? 'text-neutral-400' : 'text-white'}`}>
              Anterior
            </Text>
          </TouchableOpacity>
          <Text className="text-sm text-[#1A1A1A]/60">
            Página {page} de {data.totalPages}
          </Text>
          <TouchableOpacity
            onPress={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className={`px-4 py-2 rounded-md ${!data.hasNext ? 'bg-neutral-200' : 'bg-[#1A1A1A]'}`}
          >
            <Text className={`text-sm font-medium ${!data.hasNext ? 'text-neutral-400' : 'text-white'}`}>
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
