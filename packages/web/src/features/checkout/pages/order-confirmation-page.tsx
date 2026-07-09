/**
 * OrderConfirmationPage — Success screen after order placement.
 *
 * Route: /gracias/:id
 *
 * Displays:
 * - Animated success checkmark
 * - Order ID (truncated)
 * - Purchased items summary
 * - Order total
 * - Payment method
 * - Order status badge ("Pendiente")
 * - "Volver al catálogo" button
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatPrice, ORDER_STATUS } from '@mbt/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderRow {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  shipping_cost: number;
  discount: number;
  payment_method: string | null;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * Fetch order by ID with its items.
 */
function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single<OrderRow>();

      if (orderError) throw orderError;
      if (!order) throw new Error('Orden no encontrada');

      // Fetch order items with product details
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          subtotal,
          product:product_id (
            name,
            images
          )
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      return { order, items: items ?? [] };
    },
    enabled: !!id,
  });
}

function getStatusLabel(status: string): string {
  const found = ORDER_STATUS.find((s) => s.value === status);
  return found?.label ?? status;
}

function getStatusDescription(status: string): string {
  const found = ORDER_STATUS.find((s) => s.value === status);
  return found?.description ?? '';
}

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useOrder(id ?? '');

  // Loading state
  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-3 h-8 w-48" />
          <Skeleton className="mx-auto mb-8 h-4 w-64" />
        </div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  // Error / not found
  if (isError || !data) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-[#1A1A1A]">
          Orden no encontrada
        </h1>
        <p className="mb-8 text-[#1A1A1A]/60">
          La orden que buscás no existe o no tenés acceso a ella.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8836B] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
        >
          Volver al catálogo
        </Link>
      </section>
    );
  }

  const { order, items } = data;
  const orderTotal = order.total;
  const orderNum = order.id.substring(0, 8).toUpperCase();
  const paymentMethodLabels: Record<string, string> = {
    transferencia: 'Transferencia Bancaria',
    efectivo: 'Efectivo',
    mercado_pago: 'Mercado Pago',
    mp: 'Mercado Pago',
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      {/* Success header */}
      <div className="mb-10 text-center">
        {/* Checkmark icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-emerald-600"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-[#1A1A1A]">
          ¡Pedido confirmado!
        </h1>
        <p className="text-sm text-[#1A1A1A]/60">
          Gracias por tu compra. Te notificaremos cuando el pedido sea procesado.
        </p>
      </div>

      {/* Order number + status */}
      <div className="mb-8 rounded-lg border border-[#E2E2DC] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
              Número de orden
            </p>
            <p className="text-lg font-bold text-[#1A1A1A] font-mono">
              #{orderNum}
            </p>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm font-medium text-amber-800">
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#1A1A1A]/60">
          {getStatusDescription(order.status)}
        </p>
      </div>

      {/* Purchased items */}
      <div className="mb-8 rounded-lg border border-[#E2E2DC] bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-[#1A1A1A]">
          Productos comprados
        </h2>

        <div className="divide-y divide-[#E2E2DC]">
          {items.map((item: OrderItemRow & { product?: { name: string; images: string[] } }) => (
            <div key={item.id} className="flex items-start gap-3 py-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-[#F0F0EC]">
                <img
                  src={item.product?.images?.[0] ?? '/placeholder-product.svg'}
                  alt={item.product?.name ?? 'Producto'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {item.product?.name ?? 'Producto'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A]/60">
                    {item.quantity} x {formatPrice(item.unit_price)}
                  </span>
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals summary */}
      <div className="mb-8 rounded-lg border border-[#E2E2DC] bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-[#1A1A1A]">
          Resumen
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[#1A1A1A]/60">
            <span>Subtotal</span>
            <span>{formatPrice(orderTotal - order.shipping_cost + order.discount)}</span>
          </div>
          <div className="flex justify-between text-[#1A1A1A]/60">
            <span>Envío</span>
            <span>
              {order.shipping_cost === 0
                ? 'Gratis'
                : formatPrice(order.shipping_cost)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Descuento</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[#E2E2DC] pt-2 text-base font-bold text-[#1A1A1A]">
            <span>Total</span>
            <span>{formatPrice(orderTotal)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-4 border-t border-[#E2E2DC] pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#1A1A1A]/60">Método de pago</span>
            <span className="font-medium text-[#1A1A1A]">
              {paymentMethodLabels[order.payment_method ?? ''] ?? order.payment_method ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          to="/catalogo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8836B] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
        >
          Volver al catálogo
        </Link>
      </div>
    </section>
  );
}
