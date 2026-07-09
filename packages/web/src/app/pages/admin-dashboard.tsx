/**
 * Admin Dashboard Page — KPIs and Management Overview
 *
 * Route: /admin
 * Displays:
 * - Summary cards: revenue today, orders today, low stock count
 * - Monthly sales chart (last 6 months)
 * - Top-selling products
 * - Low stock alerts
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMonthlySales,
  useDailySales,
  useTopProducts,
  useLowStock,
  useCashSummary,
} from '@/features/admin/finance/api/use-finance-queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

export function AdminDashboardPage() {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySales();
  const { data: dailySales } = useDailySales();
  const { data: topProducts, isLoading: topLoading } = useTopProducts();
  const { data: lowStock, isLoading: lowStockLoading } = useLowStock();
  const { data: cashSummary, isLoading: cashLoading } = useCashSummary();

  // Today's revenue from daily_sales
  const todayRevenue = dailySales?.[0]?.revenue ?? 0;
  const todayOrders = dailySales?.[0]?.total_orders ?? 0;
  const maxRevenue = monthlySales
    ? Math.max(...monthlySales.map((s: any) => s.revenue), 1)
    : 1;

  const monthlySalesData = monthlySales ?? [];
  const displayedMonths = showAllMonths
    ? monthlySalesData
    : monthlySalesData.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Resumen del negocio y métricas clave.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ingresos hoy */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6 transition-shadow hover:shadow-sm">
          <p className="text-sm text-[#1A1A1A]/60">Ingresos hoy</p>
          <p className="mt-1 text-2xl font-bold text-[#1A1A1A]">
            {formatPrice(todayRevenue)}
          </p>
          <p className="mt-1 text-xs text-[#1A1A1A]/40">
            {todayOrders} {todayOrders === 1 ? 'orden completada' : 'órdenes completadas'}
          </p>
        </div>

        {/* Órdenes totales (del mes más reciente) */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6 transition-shadow hover:shadow-sm">
          <p className="text-sm text-[#1A1A1A]/60">Órdenes del mes</p>
          <p className="mt-1 text-2xl font-bold text-[#1A1A1A]">
            {salesLoading ? '...' : String(monthlySales?.[0]?.total_orders ?? 0)}
          </p>
          <p className="mt-1 text-xs text-[#1A1A1A]/40">
            Ticket promedio:{' '}
            {formatPrice(monthlySales?.[0]?.avg_ticket ?? 0)}
          </p>
        </div>

        {/* Balance de caja */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6 transition-shadow hover:shadow-sm">
          <p className="text-sm text-[#1A1A1A]/60">Balance de caja</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              (cashSummary?.balance ?? 0) >= 0
                ? 'text-emerald-600'
                : 'text-red-500'
            }`}
          >
            {cashLoading ? '...' : formatPrice(cashSummary?.balance ?? 0)}
          </p>
          <Link
            to="/admin/finanzas"
            className="mt-1 inline-block text-xs text-[#E8836B] hover:text-[#E8836B]/80"
          >
            Ver movimientos →
          </Link>
        </div>

        {/* Stock bajo */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6 transition-shadow hover:shadow-sm">
          <p className="text-sm text-[#1A1A1A]/60">Stock bajo</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              (lowStock?.length ?? 0) > 0 ? 'text-orange-500' : 'text-emerald-600'
            }`}
          >
            {lowStockLoading ? '...' : String(lowStock?.length ?? 0)}
          </p>
          <p className="mt-1 text-xs text-[#1A1A1A]/40">
            Productos con menos de 5 unidades
          </p>
        </div>
      </div>

      {/* Ventas Mensuales — Bar Chart */}
      <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Ventas mensuales
          </h2>
          {monthlySales && monthlySales.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-xs text-[#E8836B]"
            >
              {showAllMonths ? 'Ver últimos 6' : 'Ver todos'}
            </Button>
          )}
        </div>

        {salesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : displayedMonths.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#1A1A1A]/40">
            No hay datos de ventas todavía.
          </p>
        ) : (
          <div className="space-y-3">
            {displayedMonths.map((sale: any) => {
              const percent = (sale.revenue / maxRevenue) * 100;
              return (
                <div key={sale.month} className="flex items-center gap-3">
                  <span className="w-24 text-right text-xs font-medium text-[#1A1A1A]/60">
                    {new Date(sale.month).toLocaleDateString('es-AR', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex-1">
                    <div className="h-7 w-full rounded-md bg-[#F0F0EC]">
                      <div
                        className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-[#E8836B]/70 to-[#E8836B] px-2 transition-all duration-500"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {formatPrice(sale.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Grid: Top Products + Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Productos */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
            Productos más vendidos
          </h2>

          {topLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="divide-y divide-[#E2E2DC]">
              {topProducts.slice(0, 5).map((product: any, idx: number) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0F0EC] text-xs font-bold text-[#E8836B]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#1A1A1A]/40">
                        {product.units_sold} vendidos · {product.order_count}{' '}
                        {product.order_count === 1 ? 'orden' : 'órdenes'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {formatPrice(product.total_revenue)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#1A1A1A]/40">
              No hay ventas registradas.
            </p>
          )}
        </div>

        {/* Stock Bajo */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              Alertas de stock
            </h2>
            <Link
              to="/admin/productos"
              className="text-xs text-[#E8836B] hover:text-[#E8836B]/80"
            >
              Ver productos →
            </Link>
          </div>

          {lowStockLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : lowStock && lowStock.length > 0 ? (
            <div className="divide-y divide-[#E2E2DC]">
              {lowStock.map((item: any) => (
                <div
                  key={`${item.product_name}-${item.size}-${item.color}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-[#1A1A1A]/40">
                      {item.size && `Talle ${item.size}`}
                      {item.size && item.color && ' · '}
                      {item.color}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.stock === 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {item.stock === 0 ? 'Sin stock' : `${item.stock} uds.`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg">✅</p>
              <p className="mt-2 text-sm font-medium text-[#1A1A1A]/60">
                Todo en orden
              </p>
              <p className="text-xs text-[#1A1A1A]/40">
                No hay productos con stock bajo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
