/**
 * Income vs Expense Chart — grouped bar chart of monthly income and expenses.
 *
 * Uses Recharts to render a responsive `<BarChart>` with two bars per month:
 * - Income (#22C55E / green-500)
 * - Expense (#EF4444 / red-500)
 *
 * Shows the last 6 months by default. Displays skeleton placeholders
 * while loading and an empty state message when no data is available.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@mbt/shared';
import type { MonthlyChartDataPoint } from '../api/queries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a month key (e.g. "2026-01") into a short Spanish label.
 */
function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  name: string;
  value: number;
  fill: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#E8E4D9] bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-[#1A1A1A]">
        {label ? formatMonth(label) : ''}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[#1A1A1A]/70">{entry.name}</span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">
              {formatPrice(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export interface IncomeExpenseChartProps {
  /** Array of monthly data points (undefined while loading) */
  data: MonthlyChartDataPoint[] | undefined;
  /** Whether data is currently loading */
  loading: boolean;
}

/**
 * Grouped bar chart comparing monthly income vs expenses.
 *
 * - Each month shows two bars: income (green) and expense (red)
 * - Responsive container adapts to parent width
 * - Custom tooltip with formatted ARS prices
 * - Shows skeleton loading state and empty state
 */
export function IncomeExpenseChart({ data, loading }: IncomeExpenseChartProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-[#E8E4D9] bg-white py-16">
        <p className="text-sm text-[#1A1A1A]/40">
          No hay datos de ingresos y gastos para mostrar.
        </p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    monthLabel: formatMonth(point.month),
  }));

  return (
    <div className="rounded-lg border border-[#E8E4D9] bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-[#1A1A1A]">
        Ingresos vs Gastos
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 12, fill: '#1A1A1A' }}
            tickLine={false}
            axisLine={{ stroke: '#E8E4D9' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#1A1A1A' }}
            tickLine={false}
            axisLine={{ stroke: '#E8E4D9' }}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            formatter={(value: string) => (
              <span className="text-[#1A1A1A]/70">{value}</span>
            )}
          />
          <Bar
            dataKey="income"
            name="Ingresos"
            fill="#22C55E"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="expense"
            name="Gastos"
            fill="#EF4444"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
