/**
 * Order Detail Page (Admin)
 *
 * Route: /admin/ordenes/:id
 * Shows order items, customer info, status management, payment tracking.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useAdminOrder,
  useUpdateOrderStatus,
} from '@/features/admin/orders/api/use-order-queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'processing', label: 'En proceso' },
  { value: 'shipped', label: 'Enviada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'destructive',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useAdminOrder(id ?? '');
  const updateStatus = useUpdateOrderStatus();
  const [selectedStatus, setSelectedStatus] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-[#1A1A1A]/60">Orden no encontrada</p>
        <Link to="/admin/ordenes" className="mt-2 inline-block text-sm text-[#E8836B] hover:underline">
          Volver a órdenes
        </Link>
      </div>
    );
  }

  const currentStatus = selectedStatus || order.status;

  function handleStatusChange() {
    if (!selectedStatus || !order || selectedStatus === order.status) return;
    updateStatus.mutate(
      { id: order!.id, status: selectedStatus },
      { onSuccess: () => setSelectedStatus('') },
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/ordenes" className="text-sm text-[#E8836B] hover:underline">
            ← Volver a órdenes
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#1A1A1A]">
            Orden #{order.id.slice(0, 8)}
          </h1>
        </div>
        <Badge variant={STATUS_BADGE[order.status] ?? 'secondary'} className="text-sm px-4 py-1">
          {STATUS_OPTIONS.find((o) => o.value === order.status)?.label ?? order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 rounded-lg border border-[#E2E2DC] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Items</h2>
          {order.items.length === 0 ? (
            <p className="text-sm text-[#1A1A1A]/40">Sin items</p>
          ) : (
            <div className="divide-y divide-[#E2E2DC]">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-[#1A1A1A]/40">
                      {item.quantity} × {formatPrice(item.unit_price)}
                      {item.variant && (item.variant.size || item.variant.color) && (
                        <span className="ml-2 inline-flex items-center gap-1.5">
                          {item.variant.size && (
                            <span className="rounded bg-[#F0F0EC] px-1.5 py-0.5 text-[#1A1A1A]/70">
                              Talle {item.variant.size}
                            </span>
                          )}
                          {item.variant.color && (
                            <span className="inline-flex items-center gap-1 text-[#1A1A1A]/70">
                              {item.variant.color_hex && (
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-[#E2E2DC]"
                                  style={{ backgroundColor: item.variant.color_hex }}
                                />
                              )}
                              {item.variant.color}
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-between border-t border-[#E2E2DC] pt-4">
            <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
            <span className="text-lg font-bold">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estado */}
          <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Estado</h2>
            <div className="space-y-3">
              <Select
                value={currentStatus}
                onValueChange={(value: string) => setSelectedStatus(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={handleStatusChange}
                disabled={!selectedStatus || selectedStatus === order.status || updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Actualizando...' : 'Actualizar estado'}
              </Button>
            </div>
          </div>

          {/* Pago */}
          <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Pago</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Método</span>
                <span className="text-sm font-medium capitalize">{order.payment_method ?? '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Estado pago</span>
                <Badge variant={order.payment_status === 'paid' ? 'success' : 'secondary'}>
                  {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                </Badge>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Total</span>
                <span className="font-bold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Cliente</h2>
            <p className="text-sm text-[#1A1A1A]/60 break-all">{order.customer_id}</p>
            <p className="mt-2 text-xs text-[#1A1A1A]/40">
              Creada el {new Date(order.created_at).toLocaleDateString('es-AR')}
            </p>
          </div>

          {/* Notas */}
          {order.notes && (
            <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-[#1A1A1A]">Notas</h2>
              <p className="text-sm text-[#1A1A1A]/60">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
