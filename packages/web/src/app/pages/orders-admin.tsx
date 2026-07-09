/**
 * Admin Orders Page
 *
 * Route: /admin/ordenes
 * Displays all orders in a table with status filters,
 * search, and quick status update actions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders, useUpdateOrderStatus } from '@/features/admin/orders/api/use-order-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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

  const { data, isLoading } = useAdminOrders({ status, search, page, pageSize: 25 });
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
          placeholder="Buscar por ID o nota..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-48"
        />
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
              <TableRow key={order.id} className="cursor-pointer hover:bg-[#F0F0EC]">
                <TableCell className="font-medium">
                  <Link to={`/admin/ordenes/${order.id}`} className="hover:text-[#E8836B]">
                    {order.customer_name || '—'}
                  </Link>
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
                <TableCell>
                  <Select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    options={STATUS_OPTIONS.slice(1)}
                    className="w-40"
                    disabled={updateStatus.isPending}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
