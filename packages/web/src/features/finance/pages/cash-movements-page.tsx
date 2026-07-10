/**
 * CashMovementsPage — Cash flow ledger at /admin/caja.
 *
 * Features:
 * - Current balance prominently displayed at top
 * - Filters: type (income/expense) + date range
 * - Timeline of movements with type icon/color, description, amount, reference
 * - Badge per type: income = green, expense = red
 * - Loading / empty states
 */
import { useState, useMemo } from 'react';
import {
  useCashMovements,
  useBalance,
} from '../hooks/use-finance';
import { DateRangeFilter } from '../components/date-range-filter';
import type { DateRange } from '../components/date-range-filter';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { CashMovement } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Group movements by date for timeline display */
function groupByDate(movements: CashMovement[]): Map<string, CashMovement[]> {
  const groups = new Map<string, CashMovement[]>();
  for (const m of movements) {
    const dateKey = m.movementDate.substring(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(m);
    groups.set(dateKey, existing);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Type filter options
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
];

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function IconIncome() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconExpense() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-500"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Movement row
// ---------------------------------------------------------------------------

function MovementRow({ movement }: { movement: CashMovement }) {
  const isIncome = movement.type === 'income';

  return (
    <div className="flex items-start gap-4 rounded-lg border border-[#E2E2DC] bg-white p-4 transition-shadow hover:shadow-sm">
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isIncome ? 'bg-emerald-50' : 'bg-red-50'
        }`}
      >
        {isIncome ? <IconIncome /> : <IconExpense />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[#1A1A1A]">{movement.description}</p>
        {movement.referenceType && (
          <p className="mt-0.5 text-xs text-[#1A1A1A]/40">
            {movement.referenceType === 'order'
              ? 'Orden de venta'
              : movement.referenceType === 'expense'
                ? 'Gasto registrado'
                : movement.referenceType === 'purchase'
                  ? 'Compra a proveedor'
                  : movement.referenceType}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p
          className={`text-base font-bold ${
            isIncome ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {isIncome ? '+' : '-'}
          {formatPrice(movement.amount)}
        </p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isIncome
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {isIncome ? 'Ingreso' : 'Egreso'}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function CashMovementsPage() {
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return { from, to: now.toISOString().split('T')[0] };
  });
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch
  const { data: movements, isLoading, isError } = useCashMovements({
    fechaDesde: dateRange.from,
    fechaHasta: dateRange.to,
  });
  const { data: balance, isLoading: balanceLoading } = useBalance();

  // Filter by type client-side
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    if (!typeFilter) return movements;
    return movements.filter((m) => m.type === typeFilter);
  }, [movements, typeFilter]);

  // Group by date
  const grouped = useMemo(() => groupByDate(filteredMovements), [filteredMovements]);
  const sortedDates = useMemo(
    () => [...grouped.keys()].sort((a, b) => b.localeCompare(a)),
    [grouped],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] lg:text-3xl">
          Movimientos de Caja
        </h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Registro de ingresos y egresos.
        </p>
      </div>

      {/* Balance card */}
      <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
        <p className="text-sm text-[#1A1A1A]/60">Saldo actual</p>
        {balanceLoading ? (
          <Skeleton className="mt-2 h-10 w-48" />
        ) : (
          <p
            className={`mt-1 text-3xl font-bold ${
              (balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {formatPrice(balance ?? 0)}
          </p>
        )}
        <p className="mt-1 text-xs text-[#1A1A1A]/40">
          {typeFilter
            ? `Mostrando solo ${typeFilter === 'income' ? 'ingresos' : 'egresos'}`
            : 'Todos los movimientos'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="w-full lg:w-44">
          <label className="mb-1 block text-xs font-medium text-[#1A1A1A]/60">
            Tipo
          </label>
          <Select
            value={typeFilter || '__all__'}
            onValueChange={(value: string) =>
              setTypeFilter(value === '__all__' ? '' : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los tipos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Egresos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error al cargar los movimientos. Intentalo de nuevo.
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#E2E2DC] bg-white py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#1A1A1A]/20"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <p className="mt-4 text-sm font-medium text-[#1A1A1A]/50">
            {typeFilter
              ? 'No hay movimientos del tipo seleccionado.'
              : 'No hay movimientos registrados.'}
          </p>
          <p className="mt-1 text-xs text-[#1A1A1A]/30">
            Los movimientos se generan automáticamente al crear órdenes, gastos o compras.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date heading */}
              <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]/60">
                {formatDate(date)}
              </h3>

              {/* Movements for this date */}
              <div className="space-y-3">
                {grouped.get(date)?.map((movement) => (
                  <MovementRow key={movement.id} movement={movement} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}