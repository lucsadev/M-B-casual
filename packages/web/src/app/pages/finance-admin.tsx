/**
 * Admin Finance / Cash Page
 *
 * Route: /admin/finanzas
 * Displays cash movements with income/expense filter,
 * cash summary, and monthly sales chart data.
 */
import { useState } from 'react';
import {
  useCashMovements,
  useCashSummary,
  useMonthlySales,
} from '@/features/admin/finance/api/use-finance-queries';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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

export function AdminFinancePage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: movements, isLoading: movementsLoading } = useCashMovements({
    type: typeFilter || undefined,
    page,
    pageSize: 25,
  });
  const { data: summary, isLoading: summaryLoading } = useCashSummary();
  const { data: monthlySales } = useMonthlySales();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Caja</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Movimientos financieros y resumen de caja.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <p className="text-sm text-[#1A1A1A]/60">Ingresos totales</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {summaryLoading ? '...' : formatPrice(summary?.total_income ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <p className="text-sm text-[#1A1A1A]/60">Gastos totales</p>
          <p className="mt-1 text-2xl font-bold text-red-500">
            {summaryLoading ? '...' : formatPrice(summary?.total_expense ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <p className="text-sm text-[#1A1A1A]/60">Balance</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              (summary?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {summaryLoading ? '...' : formatPrice(summary?.balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Monthly sales summary */}
      {monthlySales && monthlySales.length > 0 && (
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Ventas mensuales</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {monthlySales.slice(0, 3).map((sale: any) => (
              <div key={sale.month} className="rounded-md bg-[#F0F0EC] p-4">
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {new Date(sale.month).toLocaleDateString('es-AR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="mt-1 text-lg font-bold text-[#1A1A1A]">
                  {formatPrice(sale.revenue)}
                </p>
                <p className="text-xs text-[#1A1A1A]/60">
                  {sale.total_orders} órdenes | Promedio {formatPrice(sale.avg_ticket)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash movements table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Movimientos</h2>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos' },
              { value: 'income', label: 'Ingresos' },
              { value: 'expense', label: 'Gastos' },
            ]}
            className="w-36"
          />
        </div>

        <div className="rounded-md border border-[#E2E2DC]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementsLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="space-y-2 py-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!movementsLoading && movements && movements.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-[#1A1A1A]/50">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              )}

              {movements?.data.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm text-[#1A1A1A]/60">
                    {new Date(movement.movement_date).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        movement.type === 'income'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {movement.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{movement.description}</TableCell>
                  <TableCell
                    className={`font-medium ${
                      movement.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {movement.type === 'income' ? '+' : '-'}
                    {formatPrice(movement.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-[#1A1A1A]/60">
                    {movement.reference_type ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {movements && movements.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#1A1A1A]/60">
              Página {movements.page} de {movements.totalPages} ({movements.total} movimientos)
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
                disabled={page >= movements.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
