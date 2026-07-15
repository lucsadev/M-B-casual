/**
 * ProductListItem — Native FlatList item for the mobile catalog.
 *
 * Features:
 * - Product image (first image or placeholder) with caching headers
 * - Name, price, discount badge
 * - Category badge overlay
 * - Modern card design with elevated shadows and rounded corners
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
    (product.variantDiscountPercent ?? 0) > 0;

  const discountPercent = hasDiscount
    ? product.variantDiscountPercent!
    : 0;

  const displayPrice = hasDiscount && product.effectivePrice !== undefined
    ? product.effectivePrice
    : product.price;

  const comparePrice = hasDiscount
    ? product.price
    : null;

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
      className="flex-1 max-w-[50%] p-1.5 active:opacity-70"
      onPress={handlePress}
      accessibilityLabel={`Ver detalles de ${product.name}`}
      accessibilityRole="button"
    >
      <View className="rounded-none border border-[#E8E4D9] bg-white overflow-hidden shadow-sm">
        {/* Image */}
        <View className="aspect-[3/4] bg-[#F5F5F0] relative">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
            loadingIndicatorSource={undefined}
          />

          {/* Badges overlay */}
          <View className="absolute left-2 top-2 flex-col gap-1.5">
            {isNew && (
              <View className="bg-[#D4A853] px-2.5 py-1 rounded-full shadow-md">
                <Text className="text-[10px] font-bold text-white tracking-wide">
                  NUEVO
                </Text>
              </View>
            )}
            {hasDiscount && (
              <View className="bg-red-500 px-2.5 py-1 rounded-full shadow-md">
                <Text className="text-[10px] font-bold text-white tracking-wide">
                  -{discountPercent}%
                </Text>
              </View>
            )}
          </View>
          
          {/* Quick view hint */}
          <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
        </View>

        {/* Info */}
        <View className="px-3 py-2.5 gap-1">
          <Text className="text-xs font-semibold text-[#1A1A1A]" numberOfLines={2} leadingTrim="both">
            {product.name}
          </Text>
          <View className="flex-col">
            {comparePrice !== null && (
              <View className="flex-row items-center gap-1">
                <Text className="text-[9px] font-medium text-[#1A1A1A]/40">Antes</Text>
                <Text className="text-[10px] text-[#1A1A1A]/40 line-through">
                  {formatPrice(comparePrice)}
                </Text>
              </View>
            )}
            <Text className="text-base font-bold text-[#1A1A1A]">
              {formatPrice(displayPrice)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
