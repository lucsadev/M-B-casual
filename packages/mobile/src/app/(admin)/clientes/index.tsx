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
import { useAdminCustomers } from '../../../features/admin/api/use-admin-customers';

export default function AdminCustomersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAdminCustomers({ search, page, pageSize: 20 });

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Usuarios</Text>
        <Text className="mt-1 text-sm text-[#1A1A1A]/60">
          Historial y datos de los usuarios.
        </Text>
      </View>

      <View className="px-4 mb-4">
        <TextInput
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          placeholder="Buscar por nombre, email..."
          className="w-full rounded-md border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm"
        />
      </View>

      {isLoading && (
        <View className="px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-20 rounded-md bg-[#F0F0EC]" />
          ))}
        </View>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <View className="px-4 gap-3">
          {data.data.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() =>
                router.push({
                  pathname: '/(admin)/clientes/[id]',
                  params: { id: customer.id },
                })
              }
              className="rounded-lg border border-[#E2E2DC] bg-white p-4 active:bg-[#F0F0EC]"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-full bg-[#D4A853]/20 items-center justify-center">
                  <Text className="text-base font-bold text-[#D4A853]">
                    {customer.first_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-[#1A1A1A]">
                    {customer.first_name} {customer.last_name ?? ''}
                  </Text>
                  <Text className="text-xs text-[#1A1A1A]/60">
                    {customer.email ?? customer.phone ?? 'Sin contacto'}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between mt-3 pt-3 border-t border-[#E2E2DC]/50">
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#1A1A1A]">{customer.total_orders}</Text>
                  <Text className="text-[10px] text-[#1A1A1A]/40">Pedidos</Text>
                </View>
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#1A1A1A]">
                    ${Number(customer.total_spent).toLocaleString('es-AR')}
                  </Text>
                  <Text className="text-[10px] text-[#1A1A1A]/40">Gastado</Text>
                </View>
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#1A1A1A]">
                    {customer.last_order_date
                      ? new Date(customer.last_order_date).toLocaleDateString('es-AR')
                      : '—'}
                  </Text>
                  <Text className="text-[10px] text-[#1A1A1A]/40">Último pedido</Text>
                </View>
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#1A1A1A]">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString('es-AR')
                      : '—'}
                  </Text>
                  <Text className="text-[10px] text-[#1A1A1A]/40">Cliente desde</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isLoading && isError && (
        <View className="mx-4 items-center justify-center rounded-md border border-red-200 bg-red-50 py-8 px-4">
          <Text className="text-sm font-semibold text-red-600 mb-1">Error al cargar usuarios</Text>
          <Text className="text-xs text-red-500 text-center">
            {error?.message ?? 'Error desconocido'}
          </Text>
        </View>
      )}

      {!isLoading && !isError && (!data || data.data.length === 0) && (
        <View className="mx-4 items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <Text className="text-sm text-[#1A1A1A]/50">No hay usuarios.</Text>
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
          <Text className="text-sm text-[#1A1A1A]/60">Página {page} de {data.totalPages}</Text>
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
