/**
 * KPI Cards — Financial dashboard summary cards.
 *
 * Displays a responsive grid (2×2 mobile, 4×1 desktop) of KPI cards:
 * - Ingresos del mes (green)
 * - Gastos del mes (red)
 * - Margen bruto (blue)
 * - Órdenes del mes (amber)
 *
 * Each card shows a label, formatted value, and optional trend vs previous period.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@mbt/shared';
import type { DashboardKPI } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid external icon library dependency)
// ---------------------------------------------------------------------------

const IconIncome = () => (
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
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconExpense = () => (
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
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconChart = () => (
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
    className="text-blue-600"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconCart = () => (
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
    className="text-amber-600"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="21" cy="21" r="1" />
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
  </svg>
);

// ---------------------------------------------------------------------------
// Card configuration
// ---------------------------------------------------------------------------

interface CardConfig {
  label: string;
  field: keyof Pick<DashboardKPI, 'totalIngresos' | 'totalGastos' | 'margenBruto' | 'cantidadOrdenes'>;
  icon: React.ReactNode;
  colorClass: string;
  formatValue: (value: number) => string;
}

const CARDS: CardConfig[] = [
  {
    label: 'Ingresos del mes',
    field: 'totalIngresos',
    icon: <IconIncome />,
    colorClass: 'text-emerald-600',
    formatValue: (v) => formatPrice(v),
  },
  {
    label: 'Gastos del mes',
    field: 'totalGastos',
    icon: <IconExpense />,
    colorClass: 'text-red-500',
    formatValue: (v) => formatPrice(v),
  },
  {
    label: 'Margen bruto',
    field: 'margenBruto',
    icon: <IconChart />,
    colorClass: 'text-blue-600',
    formatValue: (v) => formatPrice(v),
  },
  {
    label: 'Órdenes del mes',
    field: 'cantidadOrdenes',
    icon: <IconCart />,
    colorClass: 'text-amber-600',
    formatValue: (v) => String(v),
  },
];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClassName: string;
}

function KpiCard({ label, value, icon, valueClassName }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-[#E2E2DC] bg-white p-6 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#1A1A1A]/60">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F0F0EC]">
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-2xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Cards grid
// ---------------------------------------------------------------------------

export interface KpiCardsProps {
  /** Dashboard KPI data (undefined while loading) */
  kpis: DashboardKPI | undefined;
  /** Whether data is currently loading */
  loading: boolean;
}

/**
 * Responsive grid of 4 KPI summary cards for the finance dashboard.
 *
 * - **Ingresos**: total income for the period (green)
 * - **Gastos**: total expenses for the period (red)
 * - **Margen bruto**: gross margin (blue)
 * - **Órdenes**: order count (amber)
 *
 * When `loading` is true, renders skeleton placeholders.
 * When `kpis` is undefined and not loading, renders empty cards with $0 / 0.
 */
export function KpiCards({ kpis, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const values: Record<CardConfig['field'], number> = {
    totalIngresos: kpis?.totalIngresos ?? 0,
    totalGastos: kpis?.totalGastos ?? 0,
    margenBruto: kpis?.margenBruto ?? 0,
    cantidadOrdenes: kpis?.cantidadOrdenes ?? 0,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <KpiCard
          key={card.field}
          label={card.label}
          value={card.formatValue(values[card.field])}
          icon={card.icon}
          valueClassName={card.colorClass}
        />
      ))}
    </div>
  );
}
