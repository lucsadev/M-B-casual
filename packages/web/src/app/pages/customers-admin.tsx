/**
 * Admin Customers Page
 *
 * Route: /admin/clientes
 * Displays all customers in a table with search,
 * showing their order count, total spent, and last order date.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCustomers } from '@/features/admin/customers/api/use-customer-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

export function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminCustomers({ search, page, pageSize: 25 });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Usuarios</h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Historial y estadísticas de clientes.
          </p>
        </div>
        <Input
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Órdenes</TableHead>
              <TableHead>Total gastado</TableHead>
              <TableHead>Última orden</TableHead>
              <TableHead>Cliente desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
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
                <TableCell colSpan={6} className="py-12 text-center text-[#1A1A1A]/50">
                  {search ? 'No se encontraron clientes.' : 'No hay clientes registrados.'}
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/admin/clientes/${customer.id}`}
                    className="text-[#E8836B] hover:text-[#E8836B]/80 hover:underline"
                  >
                    {`${customer.first_name} ${customer.last_name}`.trim() || '—'}
                  </Link>
                </TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {customer.phone || '—'}
                </TableCell>
                <TableCell>{customer.total_orders}</TableCell>
                <TableCell>{formatPrice(customer.total_spent)}</TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {customer.last_order_date
                    ? new Date(customer.last_order_date).toLocaleDateString('es-AR')
                    : '—'}
                </TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {new Date(customer.created_at).toLocaleDateString('es-AR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1A1A1A]/60">
            Página {data.page} de {data.totalPages} ({data.total} clientes)
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
