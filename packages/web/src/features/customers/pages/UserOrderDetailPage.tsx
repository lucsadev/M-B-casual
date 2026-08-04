/**
 * UserOrderDetailPage — /orden/:id route.
 *
 * Shows order detail for a customer — items, status, payment info.
 * Accessible from profile orders table and messages "Ver orden" button.
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type OrderRow = Database['public']['Tables']['orders']['Row'];

interface OrderItemResult {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: { name: string; images: string[] } | null;
  product_variants: { size: string | null; color: string | null; sku: string | null } | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  processing: { label: 'En proceso', variant: 'default' },
  shipped: { label: 'Enviada', variant: 'outline' },
  delivered: { label: 'Entregada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const paymentMethodLabels: Record<string, string> = {
  transferencia: 'Transferencia Bancaria',
  efectivo: 'Efectivo',
  mercado_pago: 'Mercado Pago',
  mp: 'Mercado Pago',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useOrder(id: string) {
  return useQuery({
    queryKey: ['user-order', id],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single<OrderRow>();

      if (orderError) throw orderError;
      if (!order) throw new Error('Orden no encontrada');

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          subtotal,
          products(name, images),
          product_variants(size, color, sku)
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      return { order, items: (items ?? []) as unknown as OrderItemResult[] };
    },
    enabled: id.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function UserOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useOrder(id ?? '');

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="mb-2 text-2xl font-bold text-[#1A1A1A]">
          Orden no encontrada
        </h1>
        <p className="mb-6 text-[#1A1A1A]/60">
          La orden que buscás no existe o no tenés acceso a ella.
        </p>
        <Link to="/perfil">
          <Button className="bg-[#E8836B] text-white hover:bg-[#E8836B]/90">
            Volver a mi perfil
          </Button>
        </Link>
      </section>
    );
  }

  const { order, items } = data;
  const status = statusConfig[order.status] ?? { label: order.status, variant: 'outline' as const };
  const orderNum = order.id.substring(0, 8).toUpperCase();

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Link to="/perfil" className="mb-6 inline-block text-sm text-[#E8836B] hover:underline">
        ← Volver a mi perfil
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Orden #{orderNum}
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            {formatDate(order.created_at)}
          </p>
        </div>
        <Badge variant={status.variant} className="text-sm px-4 py-1">
          {status.label}
        </Badge>
      </div>

      {/* Items */}
      <div className="mb-6 rounded-lg border border-[#E2E2DC] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
          Productos comprados
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-[#1A1A1A]/40">Sin items</p>
        ) : (
          <div className="divide-y divide-[#E2E2DC]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3">
                {/* Product image */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#F5F5F0]">
                  {item.products?.images?.[0] ? (
                    <img
                      src={item.products.images[0]}
                      alt={item.products.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#1A1A1A]/30">
                      Sin img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {item.products?.name ?? 'Producto'}
                  </p>
                  {(item.product_variants?.size || item.product_variants?.color) && (
                    <p className="mt-0.5 text-xs text-[#1A1A1A]/50">
                      {item.product_variants.size && `Talle ${item.product_variants.size}`}
                      {item.product_variants.size && item.product_variants.color && ' · '}
                      {item.product_variants.color && (
                        <span className="inline-flex items-center gap-1">
                          {item.product_variants.color}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-[#1A1A1A]/40">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>

                <span className="font-semibold text-[#1A1A1A]">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 space-y-1.5 border-t border-[#E2E2DC] pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#1A1A1A]/60">Subtotal</span>
            <span className="text-[#1A1A1A]">
              {formatPrice(order.total - (order.shipping_cost ?? 0) + (order.discount ?? 0))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#1A1A1A]/60">Envío</span>
            <span className="text-[#1A1A1A]">
              {(order.shipping_cost ?? 0) === 0 ? 'Gratis' : formatPrice(order.shipping_cost)}
            </span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Descuento</span>
              <span className="text-emerald-600">-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[#E2E2DC] pt-2 text-lg font-bold">
            <span className="text-[#1A1A1A]">Total</span>
            <span className="text-[#1A1A1A]">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="mb-6 rounded-lg border border-[#E2E2DC] bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Pago</h2>
        <div className="flex justify-between">
          <span className="text-sm text-[#1A1A1A]/60">Método</span>
          <span className="text-sm font-medium">
            {paymentMethodLabels[order.payment_method ?? ''] ?? order.payment_method ?? '—'}
          </span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-sm text-[#1A1A1A]/60">Estado</span>
          <Badge
            variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'cancelled' ? 'destructive' : 'secondary'}
          >
            {order.payment_status === 'pending' ? 'Pendiente' :
             order.payment_status === 'paid' ? 'Pagado' :
             order.payment_status === 'refunded' ? 'Reembolsado' :
             order.payment_status === 'cancelled' ? 'Cancelado' : order.payment_status}
          </Badge>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="mb-6 rounded-lg border border-[#E2E2DC] bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Dirección de envío</h2>
          <pre className="text-sm text-[#1A1A1A]/60 whitespace-pre-wrap font-sans">
            {typeof order.shipping_address === 'object'
              ? Object.entries(order.shipping_address as Record<string, string>)
                  .filter(([k]) => !['id', 'customer_id'].includes(k))
                  .map(([_, v]) => v)
                  .filter(Boolean)
                  .join(', ')
              : String(order.shipping_address)}
          </pre>
        </div>
      )}

      {/* CTA */}
      <div className="text-center">
        <Link to="/catalogo">
          <Button className="bg-[#D4A853] text-white hover:bg-[#D4A853]/90">
            Seguir comprando
          </Button>
        </Link>
      </div>
    </section>
  );
}
