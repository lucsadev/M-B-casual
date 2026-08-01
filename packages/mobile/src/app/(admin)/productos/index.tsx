import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAdminProducts,
  useDeleteProduct,
} from '../../../features/admin/api/use-admin-products';

export default function AdminProductsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminProducts({ search, page, pageSize: 20 });
  const { mutate: deleteProduct } = useDeleteProduct();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Productos</Text>
        <Text className="mt-1 text-sm text-[#1A1A1A]/60">
          Administrá el catálogo de productos.
        </Text>
      </View>

      <View className="px-4 mb-4 flex-row gap-2">
        <TextInput
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-md border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm"
        />
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(admin)/productos/[id]',
              params: { id: 'nuevo' },
            })
          }
          className="bg-[#1A1A1A] px-4 py-2.5 rounded-md items-center justify-center"
        >
          <Text className="text-sm font-medium text-white">+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-24 rounded-md bg-[#F0F0EC]" />
          ))}
        </View>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <View className="px-4 gap-3">
          {data.data.map((product) => (
            <View
              key={product.id}
              className="rounded-lg border border-[#E2E2DC] bg-white overflow-hidden"
            >
              <View className="flex-row p-3">
                {product.images?.[0] && (
                  <View className="w-16 h-16 rounded-md bg-[#F5F5F0] overflow-hidden mr-3">
                    <Image
                      source={{ uri: product.images[0] }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-[#1A1A1A]" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text className="text-xs text-[#1A1A1A]/60 mt-0.5">
                    {product.category_name ?? 'Sin categoría'}
                  </Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-sm font-bold text-[#1A1A1A]">
                      ${product.price.toLocaleString('es-AR')}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${
                      product.isActive ? 'bg-emerald-100' : 'bg-neutral-100'
                    }`}>
                      <Text className={`text-[10px] font-bold ${
                        product.isActive ? 'text-emerald-700' : 'text-neutral-500'
                      }`}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-[#1A1A1A]/40 mt-0.5">
                    Stock: {product.total_stock}
                  </Text>
                </View>
              </View>
              <View className="border-t border-[#E2E2DC] flex-row">
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(admin)/productos/[id]',
                      params: { id: product.id },
                    })
                  }
                  className="flex-1 py-2.5 items-center border-r border-[#E2E2DC]"
                >
                  <Text className="text-xs font-medium text-[#D4A853]">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert(
                    'Eliminar producto',
                    `¿Eliminar "${product.name}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => deleteProduct({ id: product.id }),
                      },
                    ],
                  )}
                  className="flex-1 py-2.5 items-center"
                >
                  <Text className="text-xs font-medium text-red-500">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {!isLoading && (!data || data.data.length === 0) && (
        <View className="mx-4 items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <Text className="text-sm text-[#1A1A1A]/50">
            {search ? 'No se encontraron productos.' : 'No hay productos todavía.'}
          </Text>
        </View>
      )}

      {data && data.totalPages > 1 && (
        <View className="flex-row justify-center items-center gap-4 px-4 mt-6">
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`px-4 py-2 rounded-md ${page <= 1 ? 'bg-neutral-200' : 'bg-[#1A1A1A]'}`}
          >
            <Text className={`text-sm font-medium ${page <= 1 ? 'text-neutral-400' : 'text-white'}`}>
              Anterior
            </Text>
          </TouchableOpacity>
          <Text className="text-sm text-[#1A1A1A]/60">Página {page} de {data.totalPages}</Text>
          <TouchableOpacity
            onPress={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className={`px-4 py-2 rounded-md ${!data.hasNext ? 'bg-neutral-200' : 'bg-[#1A1A1A]'}`}
          >
            <Text className={`text-sm font-medium ${!data.hasNext ? 'text-neutral-400' : 'text-white'}`}>
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
