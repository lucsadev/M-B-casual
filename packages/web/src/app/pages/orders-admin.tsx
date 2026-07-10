/**
 * Admin Orders Page
 *
 * Route: /admin/ordenes
 * Displays all orders in a table with status filters,
 * search, and quick status update actions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders, useAdminOrder, useUpdateOrderStatus } from '@/features/admin/orders/api/use-order-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'processing', label: 'En proceso' },
  { value: 'shipped', label: 'Enviada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'destructive',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  processing: 'En proceso',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading } = useAdminOrders({ status, search, page, pageSize: 25 });
  const { data: selectedOrder, isLoading: isLoadingDetail } = useAdminOrder(selectedOrderId ?? '');
  const updateStatus = useUpdateOrderStatus();

  function handleStatusChange(orderId: string, newStatus: string) {
    updateStatus.mutate({ id: orderId, status: newStatus });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Órdenes</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Gestioná las órdenes de tus clientes.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Input
          placeholder="Buscar por ID, nota o cliente..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value: string) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
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
      </div>

      {/* Table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Artículos</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-48">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data && data.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-[#1A1A1A]/50">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-[#F0F0EC]"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <TableCell className="font-medium">
                  <span className="hover:text-[#E8836B]">{order.customer_name || '—'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANTS[order.status] ?? 'secondary'}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(order.total)}</TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  <span className={order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                    {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </TableCell>
                <TableCell>{order.item_count}</TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {new Date(order.created_at).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.status}
                    onValueChange={(value: string) => handleStatusChange(order.id, value)}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.slice(1).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order detail modal */}
      <Dialog
        open={!!selectedOrderId}
        onOpenChange={(o) => !o && setSelectedOrderId(null)}
        className="max-w-2xl"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Orden #{selectedOrderId ? selectedOrderId.slice(0, 8) : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant={STATUS_BADGE_VARIANTS[selectedOrder.status] ?? 'secondary'}>
                    {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
                  </Badge>
                  <span>{selectedOrder.customer_name}</span>
                  <span>·</span>
                  <span>{new Date(selectedOrder.created_at).toLocaleDateString('es-AR')}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail || !selectedOrder ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items */}
              <div className="divide-y divide-[#E2E2DC] rounded-md border border-[#E2E2DC]">
                {selectedOrder.items.length === 0 ? (
                  <p className="p-4 text-sm text-[#1A1A1A]/40">Sin items</p>
                ) : (
                  selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4">
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
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-between border-t border-[#E2E2DC] pt-3">
                <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
                <span className="text-lg font-bold">{formatPrice(selectedOrder.total)}</span>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#1A1A1A]/60">Método de pago: </span>
                  <span className="font-medium capitalize">{selectedOrder.payment_method ?? '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#1A1A1A]/60">Estado pago: </span>
                  <Badge variant={selectedOrder.payment_status === 'paid' ? 'success' : 'secondary'}>
                    {selectedOrder.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="rounded-md border border-[#E2E2DC] p-3">
                  <p className="text-xs font-medium text-[#1A1A1A]/60">Notas</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]/80">{selectedOrder.notes}</p>
                </div>
              )}

              <DialogFooter>
                <Link
                  to={`/admin/ordenes/${selectedOrder.id}`}
                  className="text-sm text-[#E8836B] hover:underline"
                  onClick={() => setSelectedOrderId(null)}
                >
                  Ver detalle completo →
                </Link>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1A1A1A]/60">
            Página {data.page} de {data.totalPages} ({data.total} órdenes)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
