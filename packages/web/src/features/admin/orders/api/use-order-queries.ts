/**
 * Admin order queries and mutations.
 *
 * Provides:
 * - useAdminOrders — paginated order list with filters
 * - useAdminOrder — single order detail with items
 * - useUpdateOrderStatus — change order status
 * - useCreateOrder — manually create an order (admin)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { buildPaginatedResponse, buildPagination } from '@mbt/shared';
import type { PaginatedResponse, PaginationParams } from '@mbt/shared';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

const ADMIN_ORDERS_KEY = ['admin', 'orders'] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderWithCustomer extends OrderRow {
  customer_name: string;
  item_count: number;
}

export interface OrderDetail extends OrderRow {
  items: (OrderItemRow & { product_name: string })[];
}

// ---------------------------------------------------------------------------
// Fetch admin orders
// ---------------------------------------------------------------------------

interface AdminOrdersFilters {
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

async function fetchAdminOrders(
  filters: AdminOrdersFilters,
): Promise<PaginatedResponse<OrderWithCustomer>> {
  const pagination = buildPagination(filters.page, filters.pageSize);
  let query = supabase
    .from('orders')
    .select('*, customers(first_name, last_name), order_items(count)', { count: 'exact' });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(
      `id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`,
    );
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  const orders: OrderWithCustomer[] = (data ?? []).map((row: any) => ({
    id: row.id,
    customer_id: row.customer_id,
    status: row.status,
    total: row.total,
    shipping_cost: row.shipping_cost,
    discount: row.discount,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    notes: row.notes,
    shipping_address: row.shipping_address,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer_name:
      row.customers
        ? `${row.customers.first_name ?? ''} ${row.customers.last_name ?? ''}`.trim()
        : 'Cuenta eliminada',
    item_count: row.order_items?.length ?? 0,
  }));

  return buildPaginatedResponse(orders, count ?? 0, pagination);
}

export function useAdminOrders(filters: AdminOrdersFilters) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, filters],
    queryFn: () => fetchAdminOrders(filters),
  });
}

// ---------------------------------------------------------------------------
// Fetch single order detail
// ---------------------------------------------------------------------------

async function fetchOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single<OrderRow>();

  if (orderError) throw orderError;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*, products(name)')
    .eq('order_id', id);

  if (itemsError) throw itemsError;

  return {
    ...order,
    items: (items ?? []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      product_name: item.products?.name ?? 'Producto eliminado',
    })),
  };
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, id],
    queryFn: () => fetchOrderDetail(id),
    enabled: id.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Update order status
// ---------------------------------------------------------------------------

interface UpdateOrderStatusInput {
  id: string;
  status: string;
  payment_status?: string;
  notes?: string;
}

async function updateOrderStatus({ id, status, payment_status, notes }: UpdateOrderStatusInput) {
  const updateData: Record<string, unknown> = { status };
  if (payment_status !== undefined) updateData.payment_status = payment_status;
  if (notes !== undefined) updateData.notes = notes;

  const { error } = await supabase
    .from('orders')
    .update(updateData as never)
    .eq('id', id);

  if (error) throw error;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
      toast.success('Estado de orden actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar orden: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Create order (admin)
// ---------------------------------------------------------------------------

interface CreateAdminOrderInput {
  customer_id: string;
  status?: string;
  total: number;
  shipping_cost?: number;
  discount?: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  items: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
  }[];
}

async function createAdminOrder(input: CreateAdminOrderInput) {
  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: input.customer_id,
      status: input.status ?? 'pending',
      total: input.total,
      shipping_cost: input.shipping_cost ?? 0,
      discount: input.discount ?? 0,
      payment_method: input.payment_method ?? null,
      payment_status: input.payment_status ?? 'pending',
      notes: input.notes ?? null,
    } as never)
    .select('id')
    .single<{ id: string }>();

  if (orderError) throw orderError;

  // Create order items
  if (input.items.length > 0) {
    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as never);

    if (itemsError) throw itemsError;
  }

  return order;
}

export function useCreateAdminOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
      toast.success('Orden creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear orden: ${error.message}`);
    },
  });
}
