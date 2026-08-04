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
import { generateSku } from '@mbt/shared';
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
    cost?: number;
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
  supplierIds?: string[];
}

async function createProduct({ product, variants, supplierIds }: CreateProductInput) {
  // Fetch category slug — needed to generate deterministic SKUs that match
  // the product's category namespace.
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', product.category_id)
    .single<{ slug: string }>();

  if (categoryError) throw categoryError;

  const categorySlug = categoryData.slug;
  const productSlug = product.slug;

  // Insert product
  const { data: productData, error: productError } = await supabase
    .from('products')
    .insert(product as unknown as never)
    .select('id')
    .single<{ id: string }>();

  if (productError) throw productError;

  // Generate SKUs and insert variants
  if (variants.length > 0) {
    const used = new Set<string>();
    const variantRows = variants.map((v, index) => {
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
        ...v,
        product_id: productData.id,
        sku,
      };
    });

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantRows as unknown as never);

    if (variantError) throw variantError;
  }

  // Insert product-supplier join rows
  if (supplierIds && supplierIds.length > 0) {
    const supplierRows = supplierIds.map((supplier_id) => ({
      product_id: productData.id,
      supplier_id,
    }));

    const { error: suppliersError } = await supabase
      .from('product_suppliers')
      .insert(supplierRows as unknown as never);

    if (suppliersError) throw suppliersError;
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
    cost?: number;
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
  supplierIds?: string[];
}

async function updateProduct({ id, product, variants, supplierIds }: UpdateProductInput) {
  // Update product
  const { error: productError } = await supabase
    .from('products')
    .update(product as unknown as never)
    .eq('id', id);

  if (productError) throw productError;

  // Resolve category slug and product slug for new variant SKU generation.
  // These may be absent from a partial update payload, so fall back to the
  // existing product row.
  let productSlug: string | undefined = product.slug;
  let categoryId: string | undefined = product.category_id;

  if (!productSlug || !categoryId) {
    const { data: existingProduct, error: existingError } = await supabase
      .from('products')
      .select('slug, category_id')
      .eq('id', id)
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
  const { data: existingVariants, error: existingVariantsError } = await supabase
    .from('product_variants')
    .select('id, sku')
    .eq('product_id', id);

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
  const variantRows = variants.map((v) => {
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
        product_id: id,
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
      product_id: id,
    };
  });

  // Upsert variants: rows with `id` match on conflict (preserve); rows
  // without `id` are inserted as new variants.
  if (variantRows.length > 0) {
    const { error: upsertError } = await supabase
      .from('product_variants')
      .upsert(variantRows as unknown as never, { onConflict: 'id' });

    if (upsertError) throw upsertError;
  }

  // Delete orphan variants that existed in the DB but were removed from the form
  const existingIds = (existingVariants ?? []).map((v) => v.id);
  const orphanIds = existingIds.filter((vid) => !submittedIds.includes(vid));

  if (orphanIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('product_variants')
      .delete()
      .in('id', orphanIds);

    if (deleteError) throw deleteError;
  }

  // Sync product-supplier links: insert missing, delete removed
  const nextSupplierIds = supplierIds ?? [];

  const { data: existingSupplierLinks, error: existingSuppliersError } = await supabase
    .from('product_suppliers')
    .select('supplier_id')
    .eq('product_id', id);

  if (existingSuppliersError) throw existingSuppliersError;

  const existingSupplierIds = (existingSupplierLinks ?? []).map((row) => row.supplier_id);

  const suppliersToInsert = nextSupplierIds.filter(
    (sid) => !existingSupplierIds.includes(sid),
  );
  if (suppliersToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('product_suppliers')
      .insert(
        suppliersToInsert.map((supplier_id) => ({
          product_id: id,
          supplier_id,
        })) as unknown as never,
      );

    if (insertError) throw insertError;
  }

  const suppliersToDelete = existingSupplierIds.filter(
    (sid) => !nextSupplierIds.includes(sid),
  );
  if (suppliersToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('product_suppliers')
      .delete()
      .eq('product_id', id)
      .in('supplier_id', suppliersToDelete);

    if (deleteError) throw deleteError;
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
