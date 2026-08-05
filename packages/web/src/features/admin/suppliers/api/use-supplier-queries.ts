/**
 * Supplier queries for the admin panel.
 *
 * - useSuppliers: full supplier list (admin management)
 * - useSupplierOptions: active suppliers, id + name only (product form multi-select)
 * - fetchProductSupplierIds: supplier ids linked to a product (edit mode prefill)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { Supplier, SupplierOption } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const SUPPLIERS_KEY = ['admin', 'suppliers'] as const;
const SUPPLIER_OPTIONS_KEY = ['admin', 'suppliers', 'options'] as const;

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Supplier product types & mapper
// ---------------------------------------------------------------------------

export interface SupplierProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  cost?: number;
  isActive: boolean;
}

type ProductRow = Database['public']['Tables']['products']['Row'];

type SupplierProductRow = Pick<
  ProductRow,
  'id' | 'name' | 'slug' | 'price' | 'cost' | 'is_active'
>;

function mapSupplierProduct(row: SupplierProductRow): SupplierProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    cost: row.cost ?? undefined,
    isActive: row.is_active,
  };
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, website, instagram, email, phone, address, is_active, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapSupplier);
}

async function fetchSupplierOptions(): Promise<SupplierOption[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
}

/**
 * Fetch the supplier ids currently linked to a product (edit mode prefill).
 */
async function fetchProductSupplierIds(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_suppliers')
    .select('supplier_id')
    .eq('product_id', productId);

  if (error) throw error;
  return (data ?? []).map((row) => row.supplier_id);
}

/**
 * Fetch the list of products linked to a supplier (reverse of
 * fetchProductSupplierIds). Two-step: resolve product ids from
 * product_suppliers, then fetch those products.
 */
async function fetchSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
  const { data: links, error: linksError } = await supabase
    .from('product_suppliers')
    .select('product_id')
    .eq('supplier_id', supplierId);

  if (linksError) throw linksError;

  const productIds = (links ?? []).map((row) => row.product_id);

  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, cost, is_active')
    .in('id', productIds);

  if (error) throw error;
  return (data ?? []).map(mapSupplierProduct);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * All suppliers ordered by name (admin list uses its own paginated query).
 */
export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: SUPPLIERS_KEY,
    queryFn: fetchSuppliers,
    staleTime: 1000 * 60 * 5, // 5 minutes — suppliers change infrequently
  });
}

/**
 * Active suppliers as id+name options for the product form multi-select.
 */
export function useSupplierOptions() {
  return useQuery<SupplierOption[]>({
    queryKey: SUPPLIER_OPTIONS_KEY,
    queryFn: fetchSupplierOptions,
    staleTime: 1000 * 60 * 5, // 5 minutes — suppliers change infrequently
  });
}

/**
 * Supplier ids linked to a product. Query key starts with `product` so the
 * existing product mutation invalidation (queryKey[0] === 'product') refetches
 * it after create/update/delete.
 */
export function useProductSupplierIds(productId?: string) {
  return useQuery<string[]>({
    queryKey: ['product', productId, 'suppliers'],
    queryFn: () => fetchProductSupplierIds(productId!),
    enabled: !!productId,
  });
}

/**
 * Products linked to a supplier (supplier detail dialog).
 */
export function useSupplierProducts(supplierId?: string) {
  return useQuery<SupplierProduct[]>({
    queryKey: ['admin', 'suppliers', supplierId, 'products'],
    queryFn: () => fetchSupplierProducts(supplierId!),
    enabled: !!supplierId,
  });
}
