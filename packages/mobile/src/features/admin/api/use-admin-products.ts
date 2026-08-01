import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type {
  Product,
  Category,
  PaginationParams,
  PaginatedResponse,
} from '@mbt/shared';
import { buildPagination, buildPaginatedResponse } from '@mbt/shared';

type ProductRow = Database['public']['Tables']['products']['Row'];
type VariantRow = Database['public']['Tables']['product_variants']['Row'];

const ADMIN_PRODUCTS_KEY = ['admin', 'products'];

export interface AdminProductWithStock extends Product {
  category_name: string | null;
  total_stock: number;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    price: row.price,
    images: row.images ?? [],
    tags: row.tags ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAdminProducts(
  filters: { search?: string; page: number; pageSize: number },
): Promise<PaginatedResponse<AdminProductWithStock>> {
  const { search, page, pageSize } = filters;
  const pagination = buildPagination(page, pageSize);

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const productIds = (data ?? []).map((r: any) => r.id);
  let stockMap = new Map<string, number>();

  if (productIds.length > 0) {
    const { data: variants } = await (supabase
      .from('product_variants') as any)
      .select('product_id, stock')
      .in('product_id', productIds);

    for (const v of variants ?? []) {
      stockMap.set(v.product_id, (stockMap.get(v.product_id) ?? 0) + v.stock);
    }
  }

  const products: AdminProductWithStock[] = (data ?? []).map((row: any) => ({
    ...mapProduct(row),
    category_name: row.categories?.name ?? null,
    total_stock: stockMap.get(row.id) ?? 0,
  }));

  return buildPaginatedResponse(products, count ?? 0, pagination);
}

export async function deleteProduct(id: string, hard = false): Promise<void> {
  if (hard) {
    await supabase.from('product_variants').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
  } else {
    await supabase.from('products').update({ is_active: false } as never).eq('id', id);
  }
}

export function useAdminProducts(filters: { search?: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, filters.search ?? '', filters.page, filters.pageSize],
    queryFn: () => getAdminProducts(filters),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      product: {
        name: string;
        slug: string;
        description?: string | null;
        category_id: string;
        price: number;
        images?: string[];
        tags?: string[];
        is_active?: boolean;
      };
      variants: {
        size?: string | null;
        color?: string | null;
        color_hex?: string | null;
        discount?: number;
        stock: number;
        sku?: string | null;
      }[];
    }) => {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(input.product as never)
        .select('id')
        .single<{ id: string }>();
      if (productError) throw productError;

      if (input.variants.length > 0) {
        const variantRows = input.variants.map((v) => ({
          ...v,
          product_id: productData.id,
        }));
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantRows as never);
        if (variantError) throw variantError;
      }
      return productData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Producto creado', 'El producto se creó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo crear: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      product: {
        name?: string;
        slug?: string;
        description?: string | null;
        category_id?: string;
        price?: number;
        images?: string[];
        tags?: string[];
        is_active?: boolean;
      };
      variants: {
        size?: string | null;
        color?: string | null;
        color_hex?: string | null;
        discount?: number;
        stock: number;
        sku?: string | null;
      }[];
    }) => {
      const { error: productError } = await supabase
        .from('products')
        .update(input.product as never)
        .eq('id', input.id);
      if (productError) throw productError;

      // Replace variants
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', input.id);
      if (deleteError) throw deleteError;

      if (input.variants.length > 0) {
        const variantRows = input.variants.map((v) => ({
          size: v.size ?? null,
          color: v.color ?? null,
          color_hex: v.color_hex ?? null,
          discount: v.discount ?? 0,
          stock: v.stock ?? 0,
          sku: v.sku ?? null,
          product_id: input.id,
        }));
        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(variantRows as never);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'product',
      });
      Alert.alert('Producto actualizado', 'El producto se actualizó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo actualizar: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) => deleteProduct(id, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Producto eliminado', 'El producto se eliminó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo eliminar: ${error.message}`);
    },
  });
}
