import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  useAdminCustomer,
  useUpdateCustomer,
} from '../../../features/admin/api/use-admin-customers';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  confirmed: 'text-blue-600 bg-blue-100',
  processing: 'text-blue-600 bg-blue-100',
  shipped: 'text-purple-600 bg-purple-100',
  delivered: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100',
};

export default function AdminCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useAdminCustomer(id ?? '');
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  if (isError || !customer) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Text className="text-lg font-bold text-[#1A1A1A] mb-2">Usuario no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#D4A853] font-medium">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = () => {
    updateCustomer(
      {
        id: customer.id,
        first_name: editName.trim() || customer.first_name,
        last_name: (editLastName.trim() || customer.last_name) ?? undefined,
        phone: (editPhone.trim() || customer.phone) ?? undefined,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const startEditing = () => {
    setEditName(customer.first_name);
    setEditLastName(customer.last_name ?? '');
    setEditPhone(customer.phone ?? '');
    setIsEditing(true);
  };

  const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = customer.orders.length > 0
    ? Math.round(totalSpent / customer.orders.length)
    : 0;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="p-4 gap-6">
        {/* Profile */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">
              Datos personales
            </Text>
            {!isEditing && (
              <TouchableOpacity onPress={startEditing}>
                <Text className="text-xs text-[#D4A853] font-medium">Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View className="rounded-lg border border-[#E2E2DC] bg-white p-4 gap-3">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Nombre"
                className="rounded-md border border-[#E2E2DC] px-3 py-2 text-sm"
              />
              <TextInput
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Apellido"
                className="rounded-md border border-[#E2E2DC] px-3 py-2 text-sm"
              />
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Teléfono"
                keyboardType="phone-pad"
                className="rounded-md border border-[#E2E2DC] px-3 py-2 text-sm"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-md items-center border border-[#E2E2DC]"
                >
                  <Text className="text-sm text-[#1A1A1A]">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-md items-center bg-[#1A1A1A]"
                >
                  <Text className="text-sm font-medium text-white">
                    {isUpdating ? 'Guardando...' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="rounded-lg border border-[#E2E2DC] bg-white p-4">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="h-12 w-12 rounded-full bg-[#D4A853]/20 items-center justify-center">
                  <Text className="text-xl font-bold text-[#D4A853]">
                    {customer.first_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-bold text-[#1A1A1A]">
                    {customer.first_name} {customer.last_name ?? ''}
                  </Text>
                  <Text className="text-xs text-[#1A1A1A]/60">{customer.phone ?? 'Sin contacto'}</Text>
                </View>
              </View>
              {customer.phone && (
                <Text className="text-sm text-[#1A1A1A]/70">📞 {customer.phone}</Text>
              )}
              <Text className="text-xs text-[#1A1A1A]/40 mt-1">
                Usuario desde {new Date(customer.created_at).toLocaleDateString('es-AR')}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Estadísticas
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-lg border border-[#E2E2DC] bg-white p-4 items-center">
              <Text className="text-xl font-bold text-[#1A1A1A]">{customer.orders.length}</Text>
              <Text className="text-[10px] text-[#1A1A1A]/40">Pedidos</Text>
            </View>
            <View className="flex-1 rounded-lg border border-[#E2E2DC] bg-white p-4 items-center">
              <Text className="text-xl font-bold text-[#1A1A1A]">
                ${totalSpent.toLocaleString('es-AR')}
              </Text>
              <Text className="text-[10px] text-[#1A1A1A]/40">Total gastado</Text>
            </View>
            <View className="flex-1 rounded-lg border border-[#E2E2DC] bg-white p-4 items-center">
              <Text className="text-xl font-bold text-[#1A1A1A]">
                ${avgTicket.toLocaleString('es-AR')}
              </Text>
              <Text className="text-[10px] text-[#1A1A1A]/40">Ticket promedio</Text>
            </View>
          </View>
        </View>

        {/* Orders */}
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Historial de pedidos
          </Text>
          {customer.orders.length > 0 ? (
            <View className="gap-2">
              {customer.orders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(admin)/ordenes/[id]',
                      params: { id: order.id },
                    })
                  }
                  className="rounded-lg border border-[#E2E2DC] bg-white p-3 active:bg-[#F0F0EC]"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-semibold text-[#1A1A1A]">
                      #{order.id.slice(0, 8)}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-neutral-100'}`}>
                      <Text className="text-[10px] font-bold">
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-xs text-[#1A1A1A]/40">
                      {new Date(order.created_at).toLocaleDateString('es-AR')}
                    </Text>
                    <Text className="text-sm font-bold text-[#1A1A1A]">
                      ${order.total.toLocaleString('es-AR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center py-8 rounded-md border border-dashed border-[#E2E2DC]">
              <Text className="text-sm text-[#1A1A1A]/50">Sin pedidos</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
