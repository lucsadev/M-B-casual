/**
 * Admin customer queries and mutations.
 *
 * Provides:
 * - useAdminCustomers — paginated customer list with search
 * - useAdminCustomer — single customer detail with order history
 * - useUpdateCustomer — update customer profile
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { buildPaginatedResponse, buildPagination } from '@mbt/shared';
import type { PaginatedResponse } from '@mbt/shared';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type AdminRoleRpc = (
  fn: 'set_admin_role' | 'remove_admin_role',
  args: { target_user_id: string },
) => Promise<{ error: Error | null }>;

/** Minimal order fields used for customer stats */
interface OrderStatsRow {
  customer_id: string;
  total: number;
  created_at: string;
}

const CUSTOMERS_KEY = ['admin', 'customers'] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerWithStats {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: Record<string, unknown> | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export interface CustomerDetail extends CustomerRow {
  orders: OrderRow[];
}

// ---------------------------------------------------------------------------
// Fetch customers (admin)
// ---------------------------------------------------------------------------

interface CustomerFilters {
  search?: string;
  page: number;
  pageSize: number;
}

async function fetchCustomers(
  filters: CustomerFilters,
): Promise<PaginatedResponse<CustomerWithStats>> {
  const pagination = buildPagination(filters.page, filters.pageSize);

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
    );
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  const rows = (data ?? []) as unknown as CustomerRow[];

  // Fetch stats for each customer
  const customerIds = rows.map((c) => c.id);
  let statsMap: Record<string, { total_orders: number; total_spent: number; last_order_date: string | null }> = {};

  if (customerIds.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id, total, created_at')
      .in('customer_id', customerIds);

    const orderRows = (orders ?? []) as unknown as OrderStatsRow[];

    statsMap = orderRows.reduce<
      Record<string, { total_orders: number; total_spent: number; last_order_date: string | null }>
    >((acc, o) => {
      if (!acc[o.customer_id]) {
        acc[o.customer_id] = { total_orders: 0, total_spent: 0, last_order_date: null };
      }
      acc[o.customer_id].total_orders++;
      acc[o.customer_id].total_spent += o.total;
      const date = o.created_at;
      if (!acc[o.customer_id].last_order_date || date > acc[o.customer_id].last_order_date!) {
        acc[o.customer_id].last_order_date = date;
      }
      return acc;
    }, {});
  }

  const enriched: CustomerWithStats[] = rows.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    first_name: c.first_name,
    last_name: c.last_name,
    phone: c.phone,
    address: c.address,
    created_at: c.created_at,
    total_orders: statsMap[c.id]?.total_orders ?? 0,
    total_spent: statsMap[c.id]?.total_spent ?? 0,
    last_order_date: statsMap[c.id]?.last_order_date ?? null,
  }));

  return buildPaginatedResponse(enriched, count ?? 0, pagination);
}

export function useAdminCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, filters],
    queryFn: () => fetchCustomers(filters),
  });
}

// ---------------------------------------------------------------------------
// Fetch single customer detail
// ---------------------------------------------------------------------------

async function fetchCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single<CustomerRow>();

  if (customerError) throw customerError;
  if (!customer) return null;

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;

  return {
    ...customer,
    orders: orders ?? [],
  };
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, id],
    queryFn: () => fetchCustomerDetail(id),
    enabled: id.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Update customer
// ---------------------------------------------------------------------------

interface UpdateCustomerInput {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: Record<string, unknown>;
}

async function updateCustomer(input: UpdateCustomerInput) {
  const updateData: Record<string, unknown> = {};
  if (input.first_name !== undefined) updateData.first_name = input.first_name;
  if (input.last_name !== undefined) updateData.last_name = input.last_name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.address !== undefined) updateData.address = input.address;

  const { error } = await supabase
    .from('customers')
    .update(updateData as never)
    .eq('id', input.id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Toggle admin role
// ---------------------------------------------------------------------------

async function toggleAdminRole(userId: string, makeAdmin: boolean) {
  const adminRoleRpc = supabase.rpc.bind(supabase) as unknown as AdminRoleRpc;
  const { error } = makeAdmin
    ? await adminRoleRpc('set_admin_role', { target_user_id: userId })
    : await adminRoleRpc('remove_admin_role', { target_user_id: userId });
  if (error) throw error;
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_admin_users');
  if (error) throw error;
  const admins = (data ?? []) as Array<{ id: string }>;
  return admins.some((u) => u.id === userId);
}

export function useCheckAdminRole(userId: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, 'admin-check', userId],
    queryFn: () => checkIsAdmin(userId),
    enabled: userId.length > 0,
  });
}

export function useToggleAdminRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) =>
      toggleAdminRole(userId, makeAdmin),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      toast.success(
        variables.makeAdmin
          ? 'Rol de administrador asignado'
          : 'Rol de administrador removido'
      );
    },
    onError: (error: Error) => {
      toast.error(`Error al cambiar rol: ${error.message}`);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      toast.success('Cliente actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar cliente: ${error.message}`);
    },
  });
}
