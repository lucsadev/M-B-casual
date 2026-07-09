/**
 * DashboardPage — Financial dashboard at /admin/finanzas.
 *
 * Displays:
 * - Date range filter (affects KPIs and profitability)
 * - KPI cards (income, expenses, margin, orders)
 * - Income vs Expense chart (last 6 months)
 * - Product profitability table
 * - Loading states for each section
 */
import { useState, useMemo } from 'react';
import { useDashboardKPI, useMonthlyChart, useProductProfitability } from '../hooks/use-finance';
import { KpiCards } from '../components/kpi-cards';
import { IncomeExpenseChart } from '../components/income-expense-chart';
import { ProfitabilityTable } from '../components/profitability-table';
import { DateRangeFilter } from '../components/date-range-filter';
import type { DateRange } from '../components/date-range-filter';

// ---------------------------------------------------------------------------
// Default range: current month
// ---------------------------------------------------------------------------

function currentMonthRange(): DateRange {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const to = now.toISOString().split('T')[0];
  return { from, to };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(currentMonthRange);

  // Convert DateRange → DashboardKPIFilters
  const kpiFilters = useMemo(
    () => ({
      fechaDesde: dateRange.from,
      fechaHasta: dateRange.to,
    }),
    [dateRange],
  );

  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
  } = useDashboardKPI(kpiFilters);

  const {
    data: chartData,
    isLoading: chartLoading,
  } = useMonthlyChart(6);

  const {
    data: profitabilityData,
    isLoading: profitabilityLoading,
  } = useProductProfitability();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] lg:text-3xl">
          Dashboard Financiero
        </h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Resumen de ingresos, gastos y rentabilidad.
        </p>
      </div>

      {/* Date range filter */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {/* KPI error state */}
      {kpisError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error al cargar los indicadores financieros. Intentalo de nuevo.
        </div>
      )}

      {/* KPI Cards */}
      <section>
        <KpiCards kpis={kpis} loading={kpisLoading} />
      </section>

      {/* Chart + Profitability grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expense Chart */}
        <section>
          <IncomeExpenseChart data={chartData} loading={chartLoading} />
        </section>

        {/* Profitability Table */}
        <section>
          <ProfitabilityTable
            data={profitabilityData}
            loading={profitabilityLoading}
          />
        </section>
      </div>
    </div>
  );
}
