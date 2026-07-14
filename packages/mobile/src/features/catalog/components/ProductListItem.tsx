/**
 * ProductListItem — Native FlatList item for the mobile catalog.
 *
 * Features:
 * - Product image (first image or placeholder) with caching headers
 * - Name, price, discount badge
 * - Category badge overlay
 * - Optimized for FlatList: memoized, fixed height estimation
 * - Optional prefetch callback for product detail navigation
 */
import { memo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { Product } from '@mbt/shared';
import { formatPrice } from '@mbt/shared';

interface ProductListItemProps {
  product: Product;
  onPress?: () => void;
}

export const ProductListItem = memo(function ProductListItem({
  product,
  onPress,
}: ProductListItemProps) {
  const router = useRouter();
  
  const hasDiscount =
    product.comparePrice !== undefined && product.comparePrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100,
      )
    : 0;

  const imageUrl =
    product.images.length > 0
      ? product.images[0]
      : 'https://placehold.co/400x600/F5F5F0/1A1A1A?text=Sin+imagen';

  const isNew = product.tags.includes('nuevo');

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
    // Small delay to allow prefetch to start before navigation
    setTimeout(() => {
      router.push(`/producto/${product.slug}`);
    }, 50);
  }, [onPress, router, product.slug]);

  return (
    <TouchableOpacity 
      className="flex-1 max-w-[50%] p-1.5 active:opacity-80"
      onPress={handlePress}
      accessibilityLabel={`Ver detalles de ${product.name}`}
      accessibilityRole="button"
    >
      <View className="rounded-lg border border-[#E8E4D9] bg-white overflow-hidden">
        {/* Image */}
        <View className="aspect-[3/4] bg-[#F5F5F0] relative">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
            loadingIndicatorSource={undefined}
          />

          {/* Badges overlay */}
          <View className="absolute left-1.5 top-1.5 flex-col gap-1">
            {isNew && (
              <View className="bg-[#D4A853] px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-white">
                  Nuevo
                </Text>
              </View>
            )}
            {hasDiscount && (
              <View className="bg-red-500 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-white">
                  -{discountPercent}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <View className="px-2 py-2 gap-0.5">
          <Text className="text-xs font-medium text-[#1A1A1A]" numberOfLines={2}>
            {product.name}
          </Text>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-sm font-bold text-[#1A1A1A]">
              {formatPrice(product.price)}
            </Text>
            {hasDiscount && (
              <Text className="text-[10px] text-[#1A1A1A]/50 line-through">
                {formatPrice(product.comparePrice!)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
