/**
 * Product mutations for the admin panel.
 *
 * Provides useCreateProduct, useUpdateProduct, and useDeleteProduct
 * hooks using TanStack Query mutations. Each mutation:
 * - Interacts with Supabase directly
 * - Invalidates the products query cache on success
 * - Shows a toast notification on success/error
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

// ---------------------------------------------------------------------------
// Keys for cache invalidation
// ---------------------------------------------------------------------------

const PRODUCTS_KEY = ['products'] as const;
const ADMIN_PRODUCTS_KEY = ['admin', 'products'] as const;

// ---------------------------------------------------------------------------
// Create product
// ---------------------------------------------------------------------------

interface CreateProductInput {
  product: {
    name: string;
    slug: string;
    description?: string | null;
    category_id: string;
    price: number;
    compare_price?: number | null;
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
}

async function createProduct({ product, variants }: CreateProductInput) {
  // Insert product
  const { data: productData, error: productError } = await supabase
    .from('products')
    .insert(product as unknown as never)
    .select('id')
    .single<{ id: string }>();

  if (productError) throw productError;

  // Insert variants if any
  if (variants.length > 0) {
    const variantRows = variants.map((v) => ({
      ...v,
      product_id: productData.id,
    }));

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantRows as unknown as never);

    if (variantError) throw variantError;
  }

  return productData;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      toast.success('Producto creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear producto: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Update product
// ---------------------------------------------------------------------------

interface UpdateProductInput {
  id: string;
  product: {
    name?: string;
    slug?: string;
    description?: string | null;
    category_id?: string;
    price?: number;
    compare_price?: number | null;
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
}

async function updateProduct({ id, product, variants }: UpdateProductInput) {
  // Update product
  const { error: productError } = await supabase
    .from('products')
    .update(product as unknown as never)
    .eq('id', id);

  if (productError) throw productError;

  // Replace variants: delete existing, insert new
  const { error: deleteError } = await supabase
    .from('product_variants')
    .delete()
    .eq('product_id', id);

  if (deleteError) throw deleteError;

  if (variants.length > 0) {
    const variantRows = variants.map((v) => ({
      size: v.size ?? null,
      color: v.color ?? null,
      color_hex: v.color_hex ?? null,
      discount: v.discount ?? 0,
      stock: v.stock ?? 0,
      sku: v.sku ?? null,
      product_id: id,
    }));

    const { error: insertError } = await supabase
      .from('product_variants')
      .insert(variantRows as unknown as never);

    if (insertError) throw insertError;
  }

  return { id };
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      // Invalidate ALL product queries (by slug or id)
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'product',
      });
      toast.success('Producto actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar producto: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Delete product
// ---------------------------------------------------------------------------

interface DeleteProductInput {
  id: string;
  hard?: boolean;
}

async function deleteProduct({ id, hard = false }: DeleteProductInput) {
  if (hard) {
    // Hard delete — remove variants first, then product
    const { error: deleteVariantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    if (deleteVariantsError) throw deleteVariantsError;

    const { error: deleteProductError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteProductError) throw deleteProductError;
  } else {
    // Soft delete — set is_active to false
    const { error } = await supabase
      .from('products')
      .update({ is_active: false } as unknown as never)
      .eq('id', id);

    if (error) throw error;
  }
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Producto eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar producto: ${error.message}`);
    },
  });
}
