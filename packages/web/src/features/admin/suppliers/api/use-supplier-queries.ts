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
    contactName: row.contact_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, contact_name, email, phone, address, is_active, created_at, updated_at')
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
