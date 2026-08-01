import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { PaginatedResponse } from '@mbt/shared';
import { buildPagination, buildPaginatedResponse } from '@mbt/shared';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type CustomerRowWithOptionalEmail = CustomerRow & { email?: string | null };

const ADMIN_CUSTOMERS_KEY = ['admin', 'customers'];

export interface CustomerWithStats {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: any;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export interface CustomerDetail extends CustomerRow {
  orders: OrderRow[];
}

function mapCustomerWithStats(row: any): CustomerWithStats {
  const totalSpent =
    typeof row.total_spent === 'string'
      ? parseFloat(row.total_spent)
      : (row.total_spent ?? 0);
  return {
    id: row.id,
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    email: row.email ?? null,
    address: row.address,
    created_at: row.created_at,
    total_orders: row.total_orders ?? 0,
    total_spent: Number.isFinite(totalSpent) ? totalSpent : 0,
    last_order_date: row.last_order_date ?? null,
  };
}

export async function getAdminCustomers(
  filters: { search?: string; page: number; pageSize: number },
): Promise<PaginatedResponse<CustomerWithStats>> {
  const { search, page, pageSize } = filters;
  const pagination = buildPagination(page, pageSize);

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as CustomerRow[];

  const customerIds = rows.map((c) => c.id);
  let statsMap: Record<string, { total_orders: number; total_spent: number; last_order_date: string | null }> = {};

  if (customerIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id, total, created_at')
      .in('customer_id', customerIds);

    if (ordersError) throw ordersError;

    const orderRows = (orders ?? []) as unknown as Array<{ customer_id: string; total: number; created_at: string }>;

    statsMap = orderRows.reduce<
      Record<string, { total_orders: number; total_spent: number; last_order_date: string | null }>
    >((acc, o) => {
      if (!acc[o.customer_id]) {
        acc[o.customer_id] = { total_orders: 0, total_spent: 0, last_order_date: null };
      }
      acc[o.customer_id].total_orders++;
      const total = typeof o.total === 'string' ? parseFloat(o.total) : (o.total ?? 0);
      acc[o.customer_id].total_spent += Number.isFinite(total) ? total : 0;
      const date = o.created_at;
      if (!acc[o.customer_id].last_order_date || date > acc[o.customer_id].last_order_date!) {
        acc[o.customer_id].last_order_date = date;
      }
      return acc;
    }, {});
  }

  const customers = rows.map((c: CustomerRowWithOptionalEmail) => ({
    id: c.id,
    user_id: c.user_id,
    first_name: c.first_name,
    last_name: c.last_name,
    phone: c.phone,
    email: c.email ?? null,
    address: c.address,
    created_at: c.created_at,
    total_orders: statsMap[c.id]?.total_orders ?? 0,
    total_spent: statsMap[c.id]?.total_spent ?? 0,
    last_order_date: statsMap[c.id]?.last_order_date ?? null,
  }));

  return buildPaginatedResponse(customers, count ?? 0, pagination);
}

export async function getAdminCustomer(id: string): Promise<CustomerDetail | null> {
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle<CustomerRow>();

  if (custError) throw custError;
  if (!customer) return null;

  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  if (orderError) throw orderError;

  return { ...customer, orders: orders ?? [] };
}

export async function updateCustomer(
  id: string,
  input: { first_name?: string; last_name?: string; phone?: string; address?: any },
): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update(input as never)
    .eq('id', id);
  if (error) throw error;
}

export function useAdminCustomers(filters: { search?: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [...ADMIN_CUSTOMERS_KEY, filters.search ?? '', filters.page, filters.pageSize],
    queryFn: () => getAdminCustomers(filters),
  });
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: [...ADMIN_CUSTOMERS_KEY, 'detail', id],
    queryFn: () => getAdminCustomer(id),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; first_name?: string; last_name?: string; phone?: string }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CUSTOMERS_KEY });
      Alert.alert('Cliente actualizado', 'Los datos se guardaron correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo actualizar: ${error.message}`);
    },
  });
}
