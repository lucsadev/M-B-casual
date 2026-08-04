import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
import { useCategories } from '../../../features/catalog/hooks/use-categories';
import {
  useCreateProduct,
  useUpdateProduct,
} from '../../../features/admin/api/use-admin-products';



export default function AdminEditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'nuevo';
  const { data: categories } = useCategories();
  const updateMutation = useUpdateProduct();
  const createMutation = useCreateProduct();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !isNew,
  });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<Array<{
    id?: string; size: string; color: string; stock: string; discount: string;
  }>>([]);
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name ?? '');
      setSlug(product.slug ?? '');
      setDescription(product.description ?? '');
      setPrice(String(product.price ?? ''));
      setCategoryId(product.category_id ?? '');
      setIsActive(product.is_active ?? true);
      setVariants(
        (product.product_variants ?? []).map((v: any) => ({
          id: v.id,
          size: v.size ?? '',
          color: v.color ?? '',
          stock: String(v.stock ?? 0),
          discount: String(v.discount ?? 0),
        })),
      );
    }
  }, [product]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Validación', 'El nombre es obligatorio.'); return; }
    if (!slug.trim()) { Alert.alert('Validación', 'El slug es obligatorio.'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('Validación', 'El precio debe ser un número.'); return; }

    setSaving(true);
    try {
      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        category_id: categoryId || undefined,
        price: Number(price),
        is_active: isActive,
      };
      const variantData = variants.map((v) => ({
        id: v.id,
        size: v.size || null,
        color: v.color || null,
        stock: Number(v.stock) || 0,
        discount: Number(v.discount) || 0,
      }));

      if (isNew) {
        await createMutation.mutateAsync({ product: productData as any, variants: variantData });
      } else {
        await updateMutation.mutateAsync({ id: id!, product: productData as any, variants: variantData });
      }
      router.back();
    } catch {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', stock: '0', discount: '0' }]);
  };

  const removeVariant = (i: number) => {
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const updateVariant = (i: number, field: string, value: string) => {
    const updated = [...variants];
    (updated[i] as any)[field] = value;
    setVariants(updated);
  };

  if (!isNew && productLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  // Category selector
  const categoryLabel = categories?.find((c) => c.id === categoryId)?.name ?? 'Seleccionar categoría';

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAF9]"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Name */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1.5">Nombre</Text>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t); if (isNew) setSlug(slugify(t)); }}
          placeholder="Nombre del producto"
          className="rounded-lg border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm"
        />
      </View>

      {/* Slug */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1.5">Slug</Text>
        <TextInput
          value={slug}
          onChangeText={setSlug}
          placeholder="url-friendly-name"
          className="rounded-lg border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm"
        />
      </View>

      {/* Price + Category */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1.5">Precio</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="numeric"
            className="rounded-lg border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm"
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1.5">Categoría</Text>
          <TouchableOpacity
            onPress={() => categories && categories.length > 0 && setShowCategoryPicker(true)}
            className="rounded-lg border border-[#E2E2DC] bg-white px-3 py-2.5"
          >
            <Text className="text-sm text-[#1A1A1A]">{categoryLabel}</Text>
          </TouchableOpacity>

          {showCategoryPicker && categories && (
            <View className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-[#E2E2DC] bg-white shadow-lg max-h-48">
              <ScrollView>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
                    className={`px-3 py-2.5 border-b border-[#E2E2DC]/50 last:border-b-0 ${
                      cat.id === categoryId ? 'bg-[#F0F0EC]' : ''
                    }`}
                  >
                    <Text className={`text-sm ${
                      cat.id === categoryId ? 'font-semibold text-[#1A1A1A]' : 'text-[#1A1A1A]/70'
                    }`}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Active toggle */}
      <TouchableOpacity
        onPress={() => setIsActive(!isActive)}
        className={`flex-row items-center justify-between rounded-lg border px-4 py-3 mb-4 ${
          isActive ? 'border-emerald-200 bg-emerald-50' : 'border-[#E2E2DC] bg-white'
        }`}
      >
        <Text className="text-sm font-medium text-[#1A1A1A]">Producto activo</Text>
        <View className={`w-10 h-5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-neutral-300'} justify-center px-0.5`}>
          <View className={`w-4 h-4 rounded-full bg-white ${isActive ? 'self-end' : 'self-start'}`} />
        </View>
      </TouchableOpacity>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1.5">Descripción</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Descripción del producto"
          multiline
          numberOfLines={3}
          className="rounded-lg border border-[#E2E2DC] bg-white px-3 py-2.5 text-sm min-h-[80px]"
          textAlignVertical="top"
        />
      </View>

      {/* Variants */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Variantes</Text>
          <TouchableOpacity onPress={addVariant} className="bg-[#1A1A1A] px-3 py-1.5 rounded-md">
            <Text className="text-xs font-medium text-white">+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {variants.map((v, i) => (
          <View key={i} className="rounded-lg border border-[#E2E2DC] bg-white p-3 mb-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-medium text-[#1A1A1A]/60">Variante {i + 1}</Text>
              <TouchableOpacity onPress={() => removeVariant(i)}>
                <Text className="text-xs text-red-500 font-medium">Eliminar</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                value={v.size}
                onChangeText={(t) => updateVariant(i, 'size', t)}
                placeholder="Talle"
                className="flex-1 rounded-md border border-[#E2E2DC] px-2.5 py-2 text-xs"
              />
              <TextInput
                value={v.color}
                onChangeText={(t) => updateVariant(i, 'color', t)}
                placeholder="Color"
                className="flex-1 rounded-md border border-[#E2E2DC] px-2.5 py-2 text-xs"
              />
            </View>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                value={v.stock}
                onChangeText={(t) => updateVariant(i, 'stock', t)}
                placeholder="Stock"
                keyboardType="numeric"
                className="flex-1 rounded-md border border-[#E2E2DC] px-2.5 py-2 text-xs"
              />
              <TextInput
                value={v.discount}
                onChangeText={(t) => updateVariant(i, 'discount', t)}
                placeholder="Dto %"
                keyboardType="numeric"
                className="flex-1 rounded-md border border-[#E2E2DC] px-2.5 py-2 text-xs"
              />
            </View>
          </View>
        ))}
        {variants.length === 0 && (
          <Text className="text-sm text-[#1A1A1A]/40 text-center py-4">
            Sin variantes. Agregá al menos una.
          </Text>
        )}
      </View>

      {/* Save button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-md items-center bg-[#1A1A1A]"
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-semibold text-base">
            {isNew ? 'Crear producto' : 'Guardar cambios'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
