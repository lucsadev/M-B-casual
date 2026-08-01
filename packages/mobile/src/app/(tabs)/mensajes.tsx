/**
 * Mensajes route — shows messages sent from the seller/admin to the user.
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useUserMessages, useMarkAsRead } from '../../features/customers/api/use-user-messages';

const TYPE_LABELS: Record<string, string> = {
  order_status: 'Pedido',
  payment_status: 'Pago',
  general: 'General',
};

const TYPE_ICONS: Record<string, string> = {
  order_status: '📦',
  payment_status: '💳',
  general: '📢',
};

export default function UserMessagesRoute() {
  const { data: messages, isLoading, isError } = useUserMessages();
  const { mutate: markAsRead } = useMarkAsRead();

  const handlePress = (msg: { id: string; isRead: boolean; orderId?: string }) => {
    if (!msg.isRead) {
      markAsRead(msg.id);
    }
    if (msg.orderId) {
      router.push(`/orden/${msg.orderId}`);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Mensajes' }} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#D4A853" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-600 text-sm text-center">
            No se pudieron cargar los mensajes.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-[#D4A853] text-sm font-medium">Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">💬</Text>
              <Text className="text-base font-semibold text-[#1A1A1A] mb-2">
                No tenés mensajes
              </Text>
              <Text className="text-sm text-[#1A1A1A]/60 text-center">
                Cuando el vendedor actualice el estado de tus pedidos, recibirás
                notificaciones aquí.
              </Text>
            </View>
          }
          renderItem={({ item: msg }) => (
            <TouchableOpacity
              onPress={() => handlePress(msg)}
              className={`rounded-lg border bg-white p-4 mb-3 ${
                !msg.isRead ? 'border-l-4 border-l-[#D4A853] border-[#E8E4D9]' : 'border-[#E8E4D9]'
              }`}
            >
              {/* Type badge + title */}
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-lg">{TYPE_ICONS[msg.type] ?? '📢'}</Text>
                <Text className="text-xs font-semibold uppercase tracking-wide text-[#1A1A1A]/50">
                  {TYPE_LABELS[msg.type] ?? msg.type}
                </Text>
                {!msg.isRead && (
                  <View className="h-2 w-2 rounded-full bg-[#D4A853]" />
                )}
              </View>

              <Text className="text-sm font-semibold text-[#1A1A1A]">
                {msg.title}
              </Text>

              {msg.body && (
                <Text className="mt-1 text-sm text-[#1A1A1A]/70">
                  {msg.body}
                </Text>
              )}

              <Text className="mt-2 text-xs text-[#1A1A1A]/40">
                {new Date(msg.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
