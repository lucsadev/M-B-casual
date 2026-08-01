/**
 * Home screen — Landing page with featured products.
 *
 * Shows a greeting, featured products section, and quick categories.
 * Matches the web HomePage layout but optimized for mobile.
 */
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useProducts } from '../../features/catalog/hooks/use-products';
import { useDiscountedProducts } from '../../features/catalog/hooks/use-discounted-products';
import { formatPrice } from '@mbt/shared';

export default function HomeScreen() {
  const { data: featuredPages } = useProducts({ tags: 'destacado', pageSize: 4 });
  const { data: discountedProducts } = useDiscountedProducts(4);

  const featuredProducts = featuredPages?.pages.flatMap((p) => p.data) ?? [];
  const offers = discountedProducts ?? [];

  return (
    <ScrollView
      className="flex-1 bg-[#FFFFFF]"
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
    >
      {/* Featured products */}
      <View className="px-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
            Destacados
          </Text>
          <Link href="/catalogo" className="text-xs text-[#D4A853] font-medium">
            Ver todo
          </Link>
        </View>

        {featuredProducts.length > 0 ? (
          <View className="flex-row flex-wrap -mx-1.5">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/producto/${product.slug}`}
                className="w-1/2 p-1.5"
                asChild
              >
                <TouchableOpacity className="rounded-lg border border-[#E8E4D9] bg-white overflow-hidden active:opacity-80">
                  <View className="aspect-[3/4] bg-[#F5F5F0]">
                    <Image
                      source={{
                        uri: product.images?.[0] ??
                          'https://placehold.co/400x600/F5F5F0/1A1A1A?text=Sin+imagen',
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="px-2 py-2">
                    <Text className="text-xs font-medium text-[#1A1A1A]" numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                      {formatPrice(product.price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ) : (
          <View className="h-48 items-center justify-center bg-[#F5F5F0] rounded-lg">
            <Text className="text-sm text-[#1A1A1A]/40">
              Cargando productos destacados...
            </Text>
          </View>
        )}
      </View>

      {/* Offers section */}
      {offers.length > 0 && (
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
              Ofertas
            </Text>
            <Link href="/catalogo?tags=oferta" className="text-xs text-[#D4A853] font-medium">
              Ver todo
            </Link>
          </View>

          <View className="flex-row flex-wrap -mx-1.5">
            {offers.map((product) => {
              const hasOfferDiscount =
                (product.variantDiscountPercent ?? 0) > 0;
              const offerDisplayPrice =
                hasOfferDiscount && product.effectivePrice !== undefined
                  ? product.effectivePrice
                  : product.price;

              return (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="w-1/2 p-1.5"
                  asChild
                >
                  <TouchableOpacity className="rounded-lg border border-[#E8E4D9] bg-white overflow-hidden active:opacity-80">
                    <View className="aspect-[3/4] bg-[#F5F5F0] relative">
                      <Image
                        source={{
                          uri: product.images?.[0] ??
                            'https://placehold.co/400x600/F5F5F0/1A1A1A?text=Sin+imagen',
                        }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      {hasOfferDiscount && (
                        <View className="absolute left-2 top-2 bg-red-500 px-2.5 py-1 rounded-full shadow-md">
                          <Text className="text-[10px] font-bold text-white tracking-wide">
                            -{product.variantDiscountPercent}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="px-2 py-2">
                      <Text className="text-xs font-medium text-[#1A1A1A]" numberOfLines={2}>
                        {product.name}
                      </Text>
                      {hasOfferDiscount && (
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Text className="text-[9px] font-medium text-[#1A1A1A]/40">Antes</Text>
                          <Text className="text-[10px] text-[#1A1A1A]/40 line-through">
                            {formatPrice(product.price)}
                          </Text>
                        </View>
                      )}
                      <Text className="text-sm font-bold text-[#1A1A1A]">
                        {formatPrice(offerDisplayPrice)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
