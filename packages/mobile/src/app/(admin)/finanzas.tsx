/**
 * Dashboard Financiero — /admin/finanzas
 *
 * Ported from web's features/finance/pages/dashboard-page.tsx
 * Shows KPI cards, income vs expense chart, product profitability.
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import DatePicker from '../../components/DatePicker';
import {
  useDashboardKPI,
  useMonthlyChart,
  useProductProfitability,
} from '../../features/finance/hooks/use-finance';

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-AR');
}

function currentMonthRange() {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const to = now.toISOString().split('T')[0];
  return { from, to };
}

export default function FinanceDashboardScreen() {
  const [dateFrom, setDateFrom] = useState(currentMonthRange().from);
  const [dateTo, setDateTo] = useState(currentMonthRange().to);

  const kpiFilters = useMemo(
    () => ({ fechaDesde: dateFrom, fechaHasta: dateTo }),
    [dateFrom, dateTo],
  );

  const { data: kpis, isLoading: kpisLoading, isError: kpisError } = useDashboardKPI(kpiFilters);
  const { data: chartData, isLoading: chartLoading } = useMonthlyChart(6);
  const { data: profitabilityData, isLoading: profitabilityLoading } = useProductProfitability();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      {/* Header */}
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Dashboard Financiero</Text>
        <Text className="mt-1 text-sm text-[#1A1A1A]/60">
          Resumen de ingresos, gastos y rentabilidad.
        </Text>
      </View>

      {/* Date range filter */}
      <View className="flex-row gap-2 px-4 mb-4">
        <View className="flex-1">
          <DatePicker
            label="Desde"
            value={dateFrom}
            onChange={setDateFrom}
          />
        </View>
        <View className="flex-1">
          <DatePicker
            label="Hasta"
            value={dateTo}
            onChange={setDateTo}
          />
        </View>
      </View>

      {/* Error state */}
      {kpisError && (
        <View className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-700">
            Error al cargar los indicadores financieros.
          </Text>
        </View>
      )}

      {/* KPI Cards */}
      <View className="flex-row flex-wrap px-4 mb-6 gap-3">
        {kpisLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="h-24 flex-1 min-w-[45%] rounded-lg bg-[#F0F0EC]" />
            ))}
          </>
        ) : kpis ? (
          <>
            <View className="flex-1 min-w-[45%] rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Text className="text-xs text-[#1A1A1A]/60">Ingresos</Text>
              <Text className="mt-1 text-lg font-bold text-emerald-600">
                {formatPrice(kpis.totalIngresos)}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Text className="text-xs text-[#1A1A1A]/60">Gastos</Text>
              <Text className="mt-1 text-lg font-bold text-red-500">
                {formatPrice(kpis.totalGastos)}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Text className="text-xs text-[#1A1A1A]/60">Margen bruto</Text>
              <Text className={`mt-1 text-lg font-bold ${kpis.margenBruto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatPrice(kpis.margenBruto)}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Text className="text-xs text-[#1A1A1A]/60">Órdenes</Text>
              <Text className="mt-1 text-lg font-bold text-[#1A1A1A]">
                {kpis.cantidadOrdenes}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Income vs Expense Chart (last 6 months) */}
      <View className="mx-4 mb-6 rounded-lg border border-[#E2E2DC] bg-white p-4">
        <Text className="text-base font-semibold text-[#1A1A1A] mb-3">
          Ingresos vs Gastos
        </Text>
        {chartLoading ? (
          <View className="gap-2">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="h-8 bg-[#F0F0EC] rounded-md" />
            ))}
          </View>
        ) : chartData && chartData.length > 0 ? (
          <View className="gap-2">
            {/* Header */}
            <View className="flex-row pb-2 border-b border-[#E2E2DC]">
              <Text className="flex-1 text-xs font-medium text-[#1A1A1A]/60">Mes</Text>
              <Text className="w-24 text-right text-xs font-medium text-emerald-600">Ingresos</Text>
              <Text className="w-24 text-right text-xs font-medium text-red-500">Gastos</Text>
            </View>
            {chartData.map((point) => (
              <View key={point.month} className="flex-row items-center py-1.5 border-b border-[#E2E2DC]/50">
                <Text className="flex-1 text-xs text-[#1A1A1A]/70">
                  {new Date(point.month + '-01').toLocaleDateString('es-AR', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text className="w-24 text-right text-xs font-medium text-emerald-600">
                  {formatPrice(point.income)}
                </Text>
                <Text className="w-24 text-right text-xs font-medium text-red-500">
                  {formatPrice(point.expense)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="py-6 text-center text-sm text-[#1A1A1A]/40">
            No hay datos para el período seleccionado.
          </Text>
        )}
      </View>

      {/* Product Profitability */}
      <View className="mx-4 rounded-lg border border-[#E2E2DC] bg-white p-4">
        <Text className="text-base font-semibold text-[#1A1A1A] mb-3">
          Rentabilidad de productos
        </Text>
        {profitabilityLoading ? (
          <View className="gap-2">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="h-10 bg-[#F0F0EC] rounded-md" />
            ))}
          </View>
        ) : profitabilityData && profitabilityData.length > 0 ? (
          <View className="gap-2">
            {/* Header */}
            <View className="flex-row pb-2 border-b border-[#E2E2DC]">
              <Text className="flex-[2] text-xs font-medium text-[#1A1A1A]/60">Producto</Text>
              <Text className="flex-1 text-right text-xs font-medium text-[#1A1A1A]/60">Margen</Text>
              <Text className="flex-1 text-right text-xs font-medium text-[#1A1A1A]/60">Ganancia</Text>
            </View>
            {profitabilityData.slice(0, 10).map((product) => (
              <View key={product.id} className="flex-row items-center py-2 border-b border-[#E2E2DC]/50 last:border-b-0">
                <View className="flex-[2]">
                  <Text className="text-sm text-[#1A1A1A]" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text className="text-[10px] text-[#1A1A1A]/40">
                    {product.units_sold} vendidos
                  </Text>
                </View>
                <Text className={`flex-1 text-right text-sm font-medium ${
                  product.margin_percent >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {product.margin_percent.toFixed(0)}%
                </Text>
                <Text className="flex-1 text-right text-sm font-medium text-[#1A1A1A]">
                  {formatPrice(product.gross_profit)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="py-6 text-center text-sm text-[#1A1A1A]/40">
            No hay datos de rentabilidad.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
