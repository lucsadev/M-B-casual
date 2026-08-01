import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMonthlySales, useDailySales, useTopProducts, useLowStock, useCashSummary } from '../../features/admin/finance/api/use-finance-queries';

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-AR');
}

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <View className="rounded-lg border border-[#E2E2DC] bg-white p-4">
      <Text className="text-xs text-[#1A1A1A]/60">{label}</Text>
      <Text
        className={`mt-1 text-xl font-bold ${valueColor ?? 'text-[#1A1A1A]'}`}
      >
        {value}
      </Text>
      {sub && <Text className="mt-0.5 text-[10px] text-[#1A1A1A]/40">{sub}</Text>}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySales();
  const { data: dailySales } = useDailySales();
  const { data: topProducts, isLoading: topLoading } = useTopProducts();
  const { data: lowStock, isLoading: lowStockLoading } = useLowStock();
  const { data: cashSummary, isLoading: cashLoading } = useCashSummary();

  const todayRevenue = (dailySales as any[])?.[0]?.revenue ?? 0;
  const todayOrders = (dailySales as any[])?.[0]?.total_orders ?? 0;

  const monthlySalesData = (monthlySales ?? []) as any[];
  const maxRevenue = monthlySalesData.length > 0
    ? Math.max(...monthlySalesData.map((s: any) => s.revenue), 1)
    : 1;
  const displayedMonths = showAllMonths
    ? monthlySalesData
    : monthlySalesData.slice(0, 6);

  const topProductsData = (topProducts ?? []) as any[];
  const lowStockData = (lowStock ?? []) as any[];

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Summary Cards */}
      <View className="gap-3 mb-6">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <KpiCard
              label="Ingresos hoy"
              value={formatPrice(todayRevenue)}
              sub={`${todayOrders} ${todayOrders === 1 ? 'orden completada' : 'órdenes completadas'}`}
            />
          </View>
          <View className="flex-1">
            <KpiCard
              label="Órdenes del mes"
              value={salesLoading ? '...' : String((monthlySalesData[0] as any)?.total_orders ?? 0)}
              sub={`Ticket promedio: ${formatPrice((monthlySalesData[0] as any)?.avg_ticket ?? 0)}`}
            />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.push('../finanzas' as any)}>
              <KpiCard
                label="Balance de caja"
                value={cashLoading ? '...' : formatPrice(cashSummary?.balance ?? 0)}
                valueColor={(cashSummary?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}
                sub="Ver movimientos →"
              />
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <KpiCard
              label="Stock bajo"
              value={lowStockLoading ? '...' : String(lowStockData.length)}
              valueColor={lowStockData.length > 0 ? 'text-orange-500' : 'text-emerald-600'}
              sub="Productos con menos de 5 unidades"
            />
          </View>
        </View>
      </View>

      {/* Monthly Sales — Horizontal Bar Chart */}
      <View className="rounded-lg border border-[#E2E2DC] bg-white p-4 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-semibold text-[#1A1A1A]">Ventas mensuales</Text>
          {monthlySalesData.length > 6 && (
            <TouchableOpacity onPress={() => setShowAllMonths(!showAllMonths)}>
              <Text className="text-xs text-[#E8836B] font-medium">
                {showAllMonths ? 'Ver últimos 6' : 'Ver todos'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {salesLoading ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="h-7 bg-[#F0F0EC] rounded-md" />
            ))}
          </View>
        ) : displayedMonths.length === 0 ? (
          <Text className="py-8 text-center text-sm text-[#1A1A1A]/40">
            No hay datos de ventas todavía.
          </Text>
        ) : (
          <View className="gap-3">
            {displayedMonths.map((sale: any) => {
              const percent = (sale.revenue / maxRevenue) * 100;
              return (
                <View key={sale.month} className="flex-row items-center gap-2">
                  <Text className="w-20 text-right text-[10px] font-medium text-[#1A1A1A]/60">
                    {new Date(sale.month).toLocaleDateString('es-AR', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <View className="flex-1">
                    <View className="h-7 rounded-md bg-[#F0F0EC] overflow-hidden">
                      <View
                        className="h-full items-end justify-center rounded-md bg-[#E8836B] px-2"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      >
                        <Text className="text-[10px] font-semibold text-white">
                          {formatPrice(sale.revenue)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Top Products + Low Stock */}
      <View className="gap-4">
        {/* Top Products */}
        <View className="rounded-lg border border-[#E2E2DC] bg-white p-4">
          <Text className="text-base font-semibold text-[#1A1A1A] mb-4">
            Productos más vendidos
          </Text>

          {topLoading ? (
            <View className="gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} className="h-8 bg-[#F0F0EC] rounded-md" />
              ))}
            </View>
          ) : topProductsData.length > 0 ? (
            <View>
              {topProductsData.slice(0, 5).map((product: any, idx: number) => (
                <View
                  key={product.id}
                  className="flex-row items-center justify-between py-2.5 border-b border-[#E2E2DC]/50 last:border-b-0"
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className="h-5 w-5 rounded-full bg-[#F0F0EC] items-center justify-center">
                      <Text className="text-[10px] font-bold text-[#E8836B]">
                        {idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-[#1A1A1A]" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text className="text-[10px] text-[#1A1A1A]/40">
                        {product.units_sold} vendidos · {product.order_count}{' '}
                        {product.order_count === 1 ? 'orden' : 'órdenes'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm font-semibold text-[#1A1A1A] ml-2">
                    {formatPrice(product.total_revenue)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="py-8 text-center text-sm text-[#1A1A1A]/40">
              No hay ventas registradas.
            </Text>
          )}
        </View>

        {/* Low Stock Alerts */}
        <View className="rounded-lg border border-[#E2E2DC] bg-white p-4">
          <Text className="text-base font-semibold text-[#1A1A1A] mb-4">
            Alertas de stock
          </Text>

          {lowStockLoading ? (
            <View className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="h-8 bg-[#F0F0EC] rounded-md" />
              ))}
            </View>
          ) : lowStockData.length > 0 ? (
            <View>
              {lowStockData.map((item: any) => (
                <View
                  key={`${item.product_name}-${item.size}-${item.color}`}
                  className="flex-row items-center justify-between py-2.5 border-b border-[#E2E2DC]/50 last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#1A1A1A]" numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text className="text-[10px] text-[#1A1A1A]/40">
                      {item.size ? `Talle ${item.size}` : ''}
                      {item.size && item.color ? ' · ' : ''}
                      {item.color ?? ''}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      item.stock === 0 ? 'bg-red-50' : 'bg-orange-50'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-medium ${
                        item.stock === 0 ? 'text-red-700' : 'text-orange-700'
                      }`}
                    >
                      {item.stock === 0 ? 'Sin stock' : `${item.stock} uds.`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-8">
              <Text className="text-lg mb-1">✅</Text>
              <Text className="text-sm font-medium text-[#1A1A1A]/60">Todo en orden</Text>
              <Text className="text-xs text-[#1A1A1A]/40">No hay productos con stock bajo.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
