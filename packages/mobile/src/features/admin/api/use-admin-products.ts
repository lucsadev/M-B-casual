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
import { buildPagination, buildPaginatedResponse, generateSku } from '@mbt/shared';

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
        discount?: number;
        stock: number;
      }[];
    }) => {
      // Fetch category slug — needed to generate deterministic SKUs that match
      // the product's category namespace.
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', input.product.category_id)
        .single<{ slug: string }>();

      if (categoryError) throw categoryError;

      const categorySlug = categoryData.slug;
      const productSlug = input.product.slug;

      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(input.product as never)
        .select('id')
        .single<{ id: string }>();
      if (productError) throw productError;

      // Generate SKUs and insert variants
      if (input.variants.length > 0) {
        const used = new Set<string>();
        const variantRows = input.variants.map((v, index) => {
          const sku = generateSku({
            categorySlug,
            productSlug,
            size: v.size,
            color: v.color,
            ordinal: index + 1,
            used,
          });
          used.add(sku);
          return {
            size: v.size ?? null,
            color: v.color ?? null,
            discount: v.discount ?? 0,
            stock: v.stock ?? 0,
            product_id: productData.id,
            sku,
          };
        });

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
        id?: string;
        size?: string | null;
        color?: string | null;
        discount?: number;
        stock: number;
      }[];
    }) => {
      const { error: productError } = await supabase
        .from('products')
        .update(input.product as never)
        .eq('id', input.id);
      if (productError) throw productError;

      // Resolve category slug and product slug for SKU generation.
      // These may be absent from a partial update payload, so fall back to the
      // existing product row.
      let productSlug: string | undefined = input.product.slug;
      let categoryId: string | undefined = input.product.category_id;

      if (!productSlug || !categoryId) {
        const { data: existingProduct, error: existingError } = await supabase
          .from('products')
          .select('slug, category_id')
          .eq('id', input.id)
          .single<{ slug: string; category_id: string }>();

        if (existingError) throw existingError;
        productSlug = productSlug ?? existingProduct.slug;
        categoryId = categoryId ?? existingProduct.category_id;
      }

      // Fetch category slug for SKU generation
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', categoryId!)
        .single<{ slug: string }>();

      if (categoryError) throw categoryError;
      const categorySlug = categoryData.slug;

      // Fetch existing variants so we can (a) preserve their SKUs on upsert and
      // (b) build a `used` set for collision avoidance when generating new SKUs.
      const { data: existingVariants, error: existingVariantsError } = await (supabase
        .from('product_variants') as any)
        .select('id, sku')
        .eq('product_id', input.id);

      if (existingVariantsError) throw existingVariantsError;

      const existingSkuMap = new Map<string, string | null>();
      const used = new Set<string>();
      for (const ev of existingVariants ?? []) {
        existingSkuMap.set(ev.id, ev.sku ?? null);
        if (ev.sku) used.add(ev.sku);
      }

      // Track which existing variant IDs were submitted (for orphan deletion)
      const submittedIds: string[] = [];
      let newVariantOrdinal = 1;

      // Build upsert rows: existing variants preserve their SKU; new variants
      // get an auto-generated SKU.
      const variantRows = input.variants.map((v) => {
        if (v.id) {
          // Existing variant — preserve existing SKU, pass it through unchanged
          submittedIds.push(v.id);
          return {
            id: v.id,
            size: v.size ?? null,
            color: v.color ?? null,
            discount: v.discount ?? 0,
            stock: v.stock ?? 0,
            sku: existingSkuMap.get(v.id) ?? null,
            product_id: input.id,
          };
        }

        // New variant — generate a fresh SKU
        const sku = generateSku({
          categorySlug,
          productSlug: productSlug!,
          size: v.size,
          color: v.color,
          ordinal: newVariantOrdinal,
          used,
        });
        used.add(sku);
        newVariantOrdinal += 1;
        return {
          size: v.size ?? null,
          color: v.color ?? null,
          discount: v.discount ?? 0,
          stock: v.stock ?? 0,
          sku,
          product_id: input.id,
        };
      });

      // Upsert variants: rows with `id` match on conflict (preserve); rows
      // without `id` are inserted as new variants.
      if (variantRows.length > 0) {
        const { error: upsertError } = await supabase
          .from('product_variants')
          .upsert(variantRows as never, { onConflict: 'id' });

        if (upsertError) throw upsertError;
      }

      // Delete orphan variants that existed in the DB but were removed from the form
      const existingIds = (existingVariants ?? []).map((v: { id: string }) => v.id);
      const orphanIds = existingIds.filter((vid: string) => !submittedIds.includes(vid));

      if (orphanIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .in('id', orphanIds);

        if (deleteError) throw deleteError;
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
