/**
 * ProductListItem — Native FlatList item for the mobile catalog.
 *
 * Features:
 * - Product image (first image or placeholder)
 * - Name, price, discount badge
 * - Category badge overlay
 * - Optimized for FlatList: memoized, fixed height estimation
 */
import { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import type { Product } from '@mbt/shared';
import { formatPrice } from '@mbt/shared';

interface ProductListItemProps {
  product: Product;
}

export const ProductListItem = memo(function ProductListItem({
  product,
}: ProductListItemProps) {
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

  return (
    <Link href={`/producto/${product.slug}`} asChild>
      <TouchableOpacity className="flex-1 max-w-[50%] p-1.5 active:opacity-80">
        <View className="rounded-lg border border-[#E8E4D9] bg-white overflow-hidden">
          {/* Image */}
          <View className="aspect-[3/4] bg-[#F5F5F0] relative">
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
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
    </Link>
  );
});
