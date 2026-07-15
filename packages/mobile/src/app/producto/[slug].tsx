/**
 * Product detail screen — Full product view with image gallery, variant selector.
 *
 * Expo Router route: /producto/:slug
 * Features:
 * - Image gallery (main image + horizontal thumbnails)
 * - Product name, price, description
 * - Size and color variant selector
 * - Stock indicator
 * - "Agregar al carrito" placeholder button
 * - Back navigation via Expo Router
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatPrice } from '@mbt/shared';
import { useProduct } from '../../features/catalog/hooks/use-product';
import { useCategories } from '../../features/catalog/hooks/use-categories';
import { VariantSelector } from '../../features/catalog/components/VariantSelector';
import { useAddToCart } from '../../features/cart/hooks/use-cart';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { data: product, isLoading, isError } = useProduct(slug ?? '');
  const { data: categories } = useCategories();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Reset selection when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
  }, [slug]);

  // Loading
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Producto', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4A853" />
        </View>
      </View>
    );
  }

  // Error / not found
  if (isError || !product) {
    return (
      <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Producto', headerBackTitle: 'Atrás' }} />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-xl font-bold text-[#1A1A1A] mb-2">
            Producto no encontrado
          </Text>
          <Text className="text-sm text-[#1A1A1A]/60 text-center mb-6">
            El producto que buscás no existe o fue eliminado.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#D4A853] px-6 py-2.5 rounded-md"
          >
            <Text className="text-white font-medium text-sm">
              Volver al catálogo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const category = categories?.find((c) => c.id === product.categoryId);
  const productImages =
    product.images.length > 0
      ? product.images
      : ['https://placehold.co/600x800/F5F5F0/1A1A1A?text=Sin+imagen'];

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const hasDiscount =
    (product.variantDiscountPercent ?? 0) > 0;

  // Resolve variant_id from selected size+color
  const selectedVariantId = (() => {
    if (!selectedSize && !selectedColor) return null;
    return product.variants.find((v) => {
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const colorMatch = !selectedColor || v.color === selectedColor;
      return sizeMatch && colorMatch;
    })?.id ?? null;
  })();

  const handleAddToCart = useCallback(() => {
    addToCart(
      {
        product_id: product.id,
        variant_id: selectedVariantId,
        quantity: 1,
      },
      {
        onSuccess: () => {
          Alert.alert('Agregado', 'Producto agregado al carrito');
        },
        onError: (err) => {
          Alert.alert('Error', err.message ?? 'Error al agregar al carrito');
        },
      },
    );
  }, [addToCart, product.id, selectedVariantId]);

  return (
    <View className="flex-1 bg-[#FFFFFF]">
      <Stack.Screen
        options={{
          title: product.name.length > 20
            ? product.name.substring(0, 20) + '...'
            : product.name,
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image gallery */}
        <View className="aspect-[3/4] bg-[#F5F5F0]">
          <Image
            source={{ uri: productImages[selectedImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Image counter */}
          <View className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 rounded-full">
            <Text className="text-xs text-white">
              {selectedImageIndex + 1} / {productImages.length}
            </Text>
          </View>
        </View>

        {/* Thumbnail strip */}
        {productImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row px-4 py-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {productImages.map((url, index) => (
              <TouchableOpacity
                key={url}
                onPress={() => setSelectedImageIndex(index)}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                  index === selectedImageIndex
                    ? 'border-[#D4A853]'
                    : 'border-transparent'
                }`}
              >
                <Image
                  source={{ uri: url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product info */}
        <View className="px-4 gap-4">
          {/* Name and price */}
          <View>
            <Text className="text-xl font-bold text-[#1A1A1A]">
              {product.name}
            </Text>

            <View className="mt-2">
              {hasDiscount && (
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <Text className="text-xs text-[#1A1A1A]/40 font-medium">Antes</Text>
                  <Text className="text-xs text-[#1A1A1A]/40 line-through">
                    {formatPrice(product.comparePrice ?? product.price)}
                  </Text>
                  <View className="bg-red-500 px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-white">
                      -{product.variantDiscountPercent}%
                    </Text>
                  </View>
                </View>
              )}
              <Text className="text-2xl font-bold text-[#1A1A1A]">
                {formatPrice(product.price)}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {product.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {product.tags.includes('nuevo') && (
                <View className="bg-[#D4A853] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">
                    Nuevo
                  </Text>
                </View>
              )}
              {product.tags.includes('oferta') && (
                <View className="bg-red-500 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">
                    Oferta
                  </Text>
                </View>
              )}
              {product.tags.includes('destacado') && (
                <View className="bg-neutral-200 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#1A1A1A]">
                    Destacado
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View>
              <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1">
                Descripción
              </Text>
              <Text className="text-sm leading-relaxed text-[#1A1A1A]/70">
                {product.description}
              </Text>
            </View>
          )}

          {/* Variant selector */}
          <VariantSelector
            variants={product.variants}
            onSizeChange={setSelectedSize}
            onColorChange={setSelectedColor}
          />

          {/* Stock indicator */}
          <View className="flex-row items-center gap-2">
            {totalStock > 0 ? (
              <>
                <View
                  className={`w-2 h-2 rounded-full ${
                    totalStock <= 5 ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                />
                <Text
                  className={`text-xs font-medium ${
                    totalStock <= 5 ? 'text-orange-700' : 'text-emerald-700'
                  }`}
                >
                  {totalStock <= 5
                    ? `Solo quedan ${totalStock}`
                    : 'En stock'}
                </Text>
              </>
            ) : (
              <>
                <View className="w-2 h-2 rounded-full bg-red-400" />
                <Text className="text-xs font-medium text-red-500">
                  Sin stock
                </Text>
              </>
            )}
          </View>

          {/* Add to cart button */}
          <TouchableOpacity
            disabled={totalStock === 0 || isAddingToCart}
            onPress={handleAddToCart}
            className={`w-full py-3 rounded-md items-center flex-row justify-center gap-2 ${
              totalStock === 0 || isAddingToCart
                ? 'bg-neutral-300'
                : 'bg-[#D4A853] active:bg-[#D4A853]/80'
            }`}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : null}
            <Text className="text-white font-semibold text-base">
              {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
