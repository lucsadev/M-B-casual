/**
 * ProfileScreen — Mobile profile screen.
 *
 * Route: /perfil (inside tabs)
 *
 * Features:
 * - Displays user profile data (name, email, phone)
 * - "Editar perfil" button that toggles an inline edit mode
 * - Order history list via FlatList
 * - "Cerrar sesión" button
 * - Loading and error states
 * - Empty state for new users without profile data
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  useProfile,
  useUpdateProfile,
} from '../hooks/use-profile';
import type { ProfileUpdateInput } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Order history types
// ---------------------------------------------------------------------------

interface OrderHistoryItem {
  id: string;
  created_at: string;
  total: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  confirmed: 'text-blue-600',
  processing: 'text-blue-600',
  shipped: 'text-purple-600',
  delivered: 'text-green-600',
  cancelled: 'text-red-600',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout: authLogout } = useAuth();
  const { profile, isLoading, error: profileError, refetch } = useProfile();
  const { update: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ------------------------------------------------------------------
  // Order history (placeholder — real list from useOrders when available)
  // ------------------------------------------------------------------

  const [orders] = useState<OrderHistoryItem[]>([]);
  const [ordersLoading] = useState(false);

  // ------------------------------------------------------------------
  // Enter edit mode with current values
  // ------------------------------------------------------------------

  const handleStartEditing = useCallback(() => {
    setEditFirstName(profile?.firstName ?? '');
    setEditLastName(profile?.lastName ?? '');
    setEditPhone(profile?.phone ?? '');
    setIsEditing(true);
  }, [profile]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  // ------------------------------------------------------------------
  // Save profile
  // ------------------------------------------------------------------

  const handleSaveProfile = useCallback(async () => {
    if (!editFirstName.trim()) {
      Alert.alert('Validación', 'El nombre es requerido.');
      return;
    }

    const input: ProfileUpdateInput = {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim() || undefined,
      phone: editPhone.trim() || null,
    };

    try {
      await updateProfile(input);
      setIsEditing(false);
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intentá de nuevo.');
    }
  }, [editFirstName, editLastName, editPhone, updateProfile]);

  // ------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await authLogout();
              router.replace('/(tabs)');
            } catch {
              Alert.alert('Error', 'No se pudo cerrar sesión.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  }, [authLogout]);

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const renderOrderItem = useCallback(
    ({ item }: { item: OrderHistoryItem }) => (
      <TouchableOpacity
        onPress={() => router.push(`/orden/${item.id}`)}
        className="flex-row items-center justify-between bg-white rounded-lg border border-[#E8E4D9] px-4 py-3"
      >
        <View className="flex-1">
          <Text className="text-sm font-medium text-[#1A1A1A]">
            Orden #{item.id.slice(0, 8)}
          </Text>
          <Text className="text-xs text-[#1A1A1A]/60 mt-0.5">
            {new Date(item.created_at).toLocaleDateString('es-AR')}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-bold text-[#1A1A1A]">
            ${item.total.toLocaleString('es-AR')}
          </Text>
          <Text
            className={`text-xs font-medium mt-0.5 ${
              ORDER_STATUS_COLORS[item.status] ?? 'text-[#1A1A1A]/60'
            }`}
          >
            {ORDER_STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ------------------------------------------------------------------
  // Profile section content
  // ------------------------------------------------------------------

  const renderProfileSection = () => {
    if (profileError) {
      return (
        <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <Text className="text-red-600 text-sm">
            Error al cargar el perfil.
          </Text>
        </View>
      );
    }

    if (isEditing) {
      return (
        <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
          <Text className="text-base font-bold text-[#1A1A1A] mb-4">
            Editar perfil
          </Text>

          <View className="mb-3">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1">
              Nombre
            </Text>
            <TextInput
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="Tu nombre"
              placeholderTextColor="#1A1A1A/40"
              autoCapitalize="words"
              className="bg-[#FFFFFF] border border-[#E8E4D9] rounded-lg px-3 py-2.5 text-base text-[#1A1A1A]"
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1">
              Apellido
            </Text>
            <TextInput
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder="Tu apellido"
              placeholderTextColor="#1A1A1A/40"
              autoCapitalize="words"
              className="bg-[#FFFFFF] border border-[#E8E4D9] rounded-lg px-3 py-2.5 text-base text-[#1A1A1A]"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1">
              Teléfono
            </Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+541123456789"
              placeholderTextColor="#1A1A1A/40"
              keyboardType="phone-pad"
              className="bg-[#FFFFFF] border border-[#E8E4D9] rounded-lg px-3 py-2.5 text-base text-[#1A1A1A]"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCancelEditing}
              disabled={isUpdating}
              className="flex-1 py-2.5 rounded-md items-center border border-[#E8E4D9]"
            >
              <Text className="text-sm font-medium text-[#1A1A1A]">
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isUpdating}
              className={`flex-1 py-2.5 rounded-md items-center ${
                isUpdating ? 'bg-neutral-300' : 'bg-[#D4A853]'
              }`}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-medium text-white">
                  Guardar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <View className="h-12 w-12 rounded-full bg-[#D4A853]/20 items-center justify-center mr-3">
            <Text className="text-xl font-bold text-[#D4A853]">
              {profile?.firstName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-[#1A1A1A]">
              {profile
                ? `${profile.firstName} ${profile.lastName}`.trim()
                : user?.email ?? 'Usuario'}
            </Text>
            <Text className="text-xs text-[#1A1A1A]/60">
              {profile?.email ?? user?.email ?? ''}
            </Text>
          </View>
        </View>

        {profile?.phone && (
          <View className="flex-row items-center mb-2">
            <Text className="text-xs text-[#1A1A1A]/60 w-20">Teléfono:</Text>
            <Text className="text-sm text-[#1A1A1A]">{profile.phone}</Text>
          </View>
        )}

        {profile?.email && (
          <View className="flex-row items-center">
            <Text className="text-xs text-[#1A1A1A]/60 w-20">Email:</Text>
            <Text className="text-sm text-[#1A1A1A]">{profile.email}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleStartEditing}
          className="mt-4 py-2.5 rounded-md items-center border border-[#D4A853]"
        >
          <Text className="text-sm font-medium text-[#D4A853]">
            Editar perfil
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ------------------------------------------------------------------
  // Main render
  // ------------------------------------------------------------------

  if (!user) {
    return (
      <View className="flex-1 bg-[#FFFFFF] items-center justify-center px-4">
        <Stack.Screen options={{ title: 'Perfil' }} />
        <Text className="text-4xl mb-4">👤</Text>
        <Text className="text-lg font-bold text-[#1A1A1A] mb-2">
          Tu perfil
        </Text>
        <Text className="text-sm text-[#1A1A1A]/60 text-center mb-6">
          Iniciá sesión para ver tu perfil, pedidos y favoritos.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/login')}
          className="bg-[#D4A853] px-6 py-2.5 rounded-md"
        >
          <Text className="text-white font-medium text-sm">
            Iniciar sesión
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ title: 'Perfil' }} />

      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Profile section */}
            {renderProfileSection()}

            {/* Order history header */}
            <Text className="text-base font-bold text-[#1A1A1A] mb-3">
              Historial de pedidos
            </Text>
          </>
        }
        ListEmptyComponent={
          ordersLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color="#D4A853" />
            </View>
          ) : (
            <View className="items-center py-8 bg-white rounded-lg border border-[#E8E4D9]">
              <Text className="text-3xl mb-2">📦</Text>
              <Text className="text-sm text-[#1A1A1A]/60">
                No tenés pedidos todavía.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View className="mt-6">
            <TouchableOpacity
              onPress={handleLogout}
              disabled={isLoggingOut}
              className={`py-3 rounded-md items-center border border-red-200 ${
                isLoggingOut ? 'bg-red-50' : 'active:bg-red-50'
              }`}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text className="text-sm font-medium text-red-600">
                  Cerrar sesión
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}