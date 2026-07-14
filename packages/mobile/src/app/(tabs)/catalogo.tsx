/**
 * Catalog screen — Product listing with search, category filter, and FlatList.
 *
 * Expo Router route: /catalogo (tab)
 * Features:
 * - Debounced search bar
 * - Horizontal category chips (ScrollView)
 * - FlatList with infinite scroll (onEndReached triggers fetchNextPage)
 * - Pull-to-refresh
 * - Skeleton loading state
 * - Empty state when no results
 * - Modern UI with elevated cards and smooth interactions
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProducts } from '../../features/catalog/hooks/use-products';
import { usePrefetchProduct } from '../../features/catalog/hooks/use-products';
import { ProductListItem } from '../../features/catalog/components/ProductListItem';
import { SearchBar } from '../../features/catalog/components/SearchBar';
import { CategoryFilter } from '../../features/catalog/components/CategoryFilter';
import type { Product } from '@mbt/shared';

function SkeletonItem() {
  return (
    <View className="flex-1 max-w-[50%] p-1.5">
      <View className="rounded-2xl border border-[#E8E4D9] bg-white overflow-hidden shadow-sm">
        <View className="aspect-[3/4] bg-[#E8E4D9]/50" />
        <View className="px-3 py-2.5 gap-2">
          <View className="h-3 bg-[#E8E4D9] rounded w-3/4" />
          <View className="h-4 bg-[#E8E4D9] rounded w-1/2" />
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <View className="w-20 h-20 rounded-full bg-[#F5F5F0] items-center justify-center mb-4">
        <Text className="text-4xl">🔍</Text>
      </View>
      <Text className="text-lg text-[#1A1A1A] font-bold mb-2">
        No encontramos productos
      </Text>
      <Text className="text-sm text-[#1A1A1A]/60 text-center leading-relaxed">
        Probá con otros filtros o categorías.
      </Text>
    </View>
  );
}

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useProducts({
    search: search || undefined,
    category: category || undefined,
    pageSize: 20,
  });

  const prefetchProduct = usePrefetchProduct();
  const products: Product[] = data?.pages.flatMap((p) => p.data) ?? [];

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Infinite scroll
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleProductPress = useCallback(
    (slug: string) => {
      prefetchProduct(slug);
    },
    [prefetchProduct],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductListItem product={item} onPress={() => handleProductPress(item.slug)} />
    ),
    [handleProductPress],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const ListHeaderComponent = (
    <View className="px-4 pt-3 pb-2 gap-3">
      {/* Header Title */}
      <View className="mb-1">
        <Text className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
          Catálogo
        </Text>
        <Text className="text-sm text-[#1A1A1A]/60 font-medium">
          Explorá nuestra colección
        </Text>
      </View>
      
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter
        activeCategory={category}
        onCategoryChange={setCategory}
      />
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#FAFAF9]">
        <Stack.Screen options={{ title: 'Catálogo' }} />
        {ListHeaderComponent}
        <View className="flex-row flex-wrap px-2.5 pt-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </View>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View className="flex-1 bg-[#FAFAF9]" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ title: 'Catálogo' }} />
        {ListHeaderComponent}
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4">
            <Text className="text-4xl">⚠️</Text>
          </View>
          <Text className="text-lg text-[#1A1A1A] font-bold mb-2">
            Error al cargar
          </Text>
          <Text className="text-sm text-[#1A1A1A]/60 text-center leading-relaxed mb-6">
            No pudimos conectar con el servidor.{'\n'}Tirá hacia abajo para reintentar.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FAFAF9]">
      <Stack.Screen options={{ title: 'Catálogo' }} />

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="large" color="#D4A853" />
              <Text className="text-xs text-[#1A1A1A]/50 font-medium mt-2">
                Cargando más productos...
              </Text>
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A853"
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        columnWrapperStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={7}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        getItemLayout={(_data, index) => ({
          length: 220, // Approximate height per item
          offset: 220 * Math.floor(index / 2), // Account for 2 columns
          index,
        })}
      />
    </View>
  );
}
