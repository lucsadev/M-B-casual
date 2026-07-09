/**
 * Home screen — Landing page with featured products.
 *
 * Shows a greeting, featured products section, and quick categories.
 * Matches the web HomePage layout but optimized for mobile.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProducts } from '../../features/catalog/hooks/use-products';
import { useCategories } from '../../features/catalog/hooks/use-categories';
import { formatPrice } from '@mbt/shared';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: featuredPages } = useProducts({ tags: 'destacado', pageSize: 4 });
  const { data: categories } = useCategories();

  const featuredProducts = featuredPages?.pages.flatMap((p) => p.data) ?? [];

  return (
    <ScrollView
      className="flex-1 bg-[#FFFFFF]"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
{/* Hero section */}
      <View className="px-4 pt-4 pb-6">
        <View className="mb-2">
          <Text style={{ fontFamily: 'CormorantGaramond', fontSize: 36, fontWeight: '700', color: '#1A1A1A', lineHeight: 40 }}>
            M&B
          </Text>
        </View>
        <View className="mb-2">
          <Text style={{ fontFamily: 'Montserrat', fontSize: 14, fontWeight: '300', color: '#1A1A1A', letterSpacing: 8 }}>
            CASUAL
          </Text>
        </View>
        <View className="mt-1">
          <Text style={{ fontFamily: 'Allura', fontSize: 18, color: '#1A1A1A', lineHeight: 24 }}>
            Estilo casual para todos tus días
          </Text>
        </View>
      </View>

      {/* Quick categories */}
      {categories && categories.length > 0 && (
        <View className="px-4 mb-6">
          <Text className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide mb-3">
            Categorías
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ gap: 12 }}
          >
            {categories.map((cat) => (
              <Link key={cat.id} href={`/catalogo?category=${cat.slug}`} asChild>
                <TouchableOpacity className="items-center gap-2">
                  <View className="w-20 h-20 rounded-full bg-[#F5F5F0] items-center justify-center border border-[#E8E4D9]">
                    {cat.imageUrl ? (
                      <Image
                        source={{ uri: cat.imageUrl }}
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-2xl opacity-30">📁</Text>
                    )}
                  </View>
                  <Text className="text-xs font-medium text-[#1A1A1A]">
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>
      )}

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
                        uri: product.images[0] ??
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
    </ScrollView>
  );
}
