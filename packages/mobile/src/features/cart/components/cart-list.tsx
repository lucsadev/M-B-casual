/**
 * CartList — FlatList of cart items for mobile.
 *
 * Renders each cart item with:
 * - Product image, name, variant info
 * - Quantity stepper (+/-)
 * - Line total
 * - Delete button
 *
 * Uses React Native's built-in FlatList. Swipe-to-delete requires
 * react-native-gesture-handler; a standard delete button is provided
 * as fallback.
 */
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { CartItem } from '@mbt/shared';

// ---------------------------------------------------------------------------
// CartItemCard
// ---------------------------------------------------------------------------

interface CartItemCardProps {
  item: CartItem;
  isUpdating?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

function CartItemCard({
  item,
  isUpdating,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemCardProps) {
  const lineTotal = item.unit_price * item.quantity;
  const imageUrl = item.product_image ?? 'https://via.placeholder.com/80';

  return (
    <View
      className={`flex-row gap-3 border-b border-[#E8E4D9] py-4 px-4 ${
        isUpdating ? 'opacity-60' : ''
      }`}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: imageUrl }}
        className="h-20 w-20 rounded-md bg-[#F5F5F0]"
        resizeMode="cover"
      />

      {/* Info */}
      <View className="flex-1 gap-1">
        {/* Name + variant + price */}
        <View className="flex-row justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-medium text-[#1A1A1A]" numberOfLines={2}>
              {item.product_name}
            </Text>
            {item.variant_label && (
              <Text className="text-xs text-[#1A1A1A]/50 mt-0.5">
                {item.variant_label}
              </Text>
            )}
          </View>
          <Text className="text-sm font-semibold text-[#1A1A1A]">
            ${lineTotal.toLocaleString('es-AR')}
          </Text>
        </View>

        {/* Quantity stepper + remove */}
        <View className="flex-row items-center justify-between mt-auto pt-2">
          {/* Stepper */}
          <View className="flex-row items-center gap-1 rounded-md border border-[#E8E4D9]">
            <TouchableOpacity
              onPress={onDecrement}
              disabled={item.quantity <= 1 || isUpdating}
              className="h-7 w-7 items-center justify-center"
              accessibilityLabel="Disminuir cantidad"
            >
              <Text className="text-sm text-[#1A1A1A]">−</Text>
            </TouchableOpacity>
            <Text className="h-7 w-8 text-center text-xs font-semibold text-[#1A1A1A] leading-7">
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={onIncrement}
              disabled={isUpdating}
              className="h-7 w-7 items-center justify-center"
              accessibilityLabel="Aumentar cantidad"
            >
              <Text className="text-sm text-[#1A1A1A]">+</Text>
            </TouchableOpacity>
          </View>

          {/* Remove */}
          <TouchableOpacity
            onPress={onRemove}
            disabled={isUpdating}
            className="flex-row items-center gap-1 px-2 py-1"
            accessibilityLabel="Eliminar producto"
          >
            <Text className="text-xs text-red-500">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CartList (FlatList wrapper)
// ---------------------------------------------------------------------------

interface CartListProps {
  items: CartItem[];
  isLoading: boolean;
  isUpdating: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onIncrement: (itemId: string, currentQty: number) => void;
  onDecrement: (itemId: string, currentQty: number) => void;
  onRemove: (itemId: string) => void;
  ListFooterComponent?: React.ReactElement | null;
}

export function CartList({
  items,
  isLoading,
  isUpdating,
  refreshing,
  onRefresh,
  onIncrement,
  onDecrement,
  onRemove,
  ListFooterComponent,
}: CartListProps) {
  if (isLoading && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-4">🛒</Text>
        <Text className="text-lg font-bold text-[#1A1A1A] mb-2">
          Tu carrito está vacío
        </Text>
        <Text className="text-sm text-[#1A1A1A]/60 text-center mb-6">
          Explorá nuestro catálogo y agregá productos al carrito.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CartItemCard
          item={item}
          isUpdating={isUpdating}
          onIncrement={() => onIncrement(item.id, item.quantity)}
          onDecrement={() => onDecrement(item.id, item.quantity)}
          onRemove={() => onRemove(item.id)}
        />
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={ListFooterComponent}
    />
  );
}
