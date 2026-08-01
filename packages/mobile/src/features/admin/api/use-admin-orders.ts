import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type {
  Order,
  OrderItem,
  PaginationParams,
  PaginatedResponse,
} from '@mbt/shared';
import { buildPagination, buildPaginatedResponse } from '@mbt/shared';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type VariantRow = Database['public']['Tables']['product_variants']['Row'];

export interface OrderWithCustomer extends Order {
  customer_name: string | null;
  item_count: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product_name: string;
  variant: {
    size: string | null;
    color: string | null;
    color_hex: string | null;
    sku: string | null;
  } | null;
}

export interface OrderDetail extends Order {
  customer_name: string | null;
  customer_phone: string | null;
  items: OrderItemWithProduct[];
}

export interface AdminOrdersFilters {
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface UpdateOrderStatusInput {
  id: string;
  status: string;
  payment_status?: string;
  notes?: string;
}

const ADMIN_ORDERS_KEY = ['admin', 'orders'];

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customerId: row.customer_id ?? undefined,
    status: row.status as Order['status'],
    total: row.total,
    shippingCost: row.shipping_cost ?? undefined,
    discount: row.discount ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
    notes: row.notes ?? undefined,
    shippingAddress: row.shipping_address ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    variantId: row.variant_id ?? undefined,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    subtotal: row.subtotal,
  };
}

export async function getAdminOrders(
  filters: AdminOrdersFilters,
): Promise<PaginatedResponse<OrderWithCustomer>> {
  const { status, search, page, pageSize } = filters;
  const pagination = buildPagination(page, pageSize);

  let query = supabase
    .from('orders')
    .select('*, customers(first_name, last_name), order_items(count)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`id.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const orders: OrderWithCustomer[] = (data ?? []).map((row: any) => ({
    ...mapOrder(row),
    customer_name:
      row.customers
        ? `${row.customers.first_name} ${row.customers.last_name ?? ''}`.trim()
        : null,
    item_count: row.order_items?.[0]?.count ?? 0,
  }));

  return buildPaginatedResponse(orders, count ?? 0, pagination);
}

export async function getAdminOrder(id: string): Promise<OrderDetail | null> {
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .select('*, customers(*)')
    .eq('id', id)
    .maybeSingle<any>();

  if (orderError) throw orderError;
  if (!orderRow) return null;

  const customer = orderRow.customers as CustomerRow | null;

  const { data: itemRows, error: itemsError } = await supabase
    .from('order_items')
    .select('*, products(name), product_variants(size, color, color_hex, sku)')
    .eq('order_id', id);

  if (itemsError) throw itemsError;

  const items: OrderItemWithProduct[] = (itemRows ?? []).map((item: any) => ({
    ...mapOrderItem(item),
    product_name: item.products?.name ?? 'Producto',
    variant: item.product_variants
      ? {
          size: item.product_variants.size ?? null,
          color: item.product_variants.color ?? null,
          color_hex: item.product_variants.color_hex ?? null,
          sku: item.product_variants.sku ?? null,
        }
      : null,
  }));

  return {
    ...mapOrder(orderRow),
    customer_name: customer
      ? `${customer.first_name} ${customer.last_name ?? ''}`.trim()
      : null,
    customer_phone: customer?.phone ?? null,
    items,
  };
}

export async function updateOrderStatus(input: UpdateOrderStatusInput): Promise<void> {
  const updateData: Record<string, any> = { status: input.status };
  if (input.payment_status !== undefined) updateData.payment_status = input.payment_status;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { error } = await supabase
    .from('orders')
    .update(updateData as never)
    .eq('id', input.id);

  if (error) throw error;

  // Send message to customer (fire and forget)
  sendOrderStatusMessage(input.id, input.status, input.payment_status).catch((e) =>
    console.error('Failed to send status message:', e),
  );
}

// ---------------------------------------------------------------------------
// Send a message to the customer about an order/payment status change
// ---------------------------------------------------------------------------

async function sendOrderStatusMessage(orderId: string, newStatus?: string, newPaymentStatus?: string): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('customer_id')
    .eq('id', orderId)
    .single<{ customer_id: string }>();

  if (orderError || !order) {
    console.error('Could not send status message: order not found', orderError);
    return;
  }

  if (newStatus) {
    const label = ORDER_STATUS_LABELS[newStatus] ?? newStatus;
    await supabase.from('messages').insert({
      customer_id: order.customer_id,
      order_id: orderId,
      type: 'order_status',
      title: `Pedido actualizado a ${label}`,
      body: `El estado de tu pedido cambió a "${label}".`,
    } as never);
  }

  if (newPaymentStatus) {
    const label = PAYMENT_STATUS_LABELS[newPaymentStatus] ?? newPaymentStatus;
    await supabase.from('messages').insert({
      customer_id: order.customer_id,
      order_id: orderId,
      type: 'payment_status',
      title: `Estado de pago actualizado a ${label}`,
      body: `El estado del pago de tu pedido cambió a "${label}".`,
    } as never);
  }
}

export function useAdminOrders(filters: AdminOrdersFilters) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, filters.status ?? 'all', filters.search ?? '', filters.page, filters.pageSize],
    queryFn: () => getAdminOrders(filters),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, id],
    queryFn: () => getAdminOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) => updateOrderStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
      Alert.alert('Estado actualizado', 'El estado del pedido se actualizó correctamente.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `No se pudo actualizar: ${error.message}`);
    },
  });
}
