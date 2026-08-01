/**
 * Movimientos de Caja — /admin/caja
 *
 * Ported from web's features/finance/pages/cash-movements-page.tsx
 * Shows balance, timeline of movements grouped by date, filters.
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import DatePicker from '../../components/DatePicker';
import Select from '../../components/Select';
import {
  useCashMovements,
  useBalance,
} from '../../features/finance/hooks/use-finance';
import type { CashMovement } from '@mbt/shared';

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-AR');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

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

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
];

export default function CashMovementsScreen() {
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultTo = now.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: movements, isLoading, isError } = useCashMovements({
    fechaDesde: dateFrom,
    fechaHasta: dateTo,
  });
  const { data: balance, isLoading: balanceLoading } = useBalance();

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    if (!typeFilter) return movements;
    return movements.filter((m) => m.type === typeFilter);
  }, [movements, typeFilter]);

  const grouped = useMemo(() => groupByDate(filteredMovements), [filteredMovements]);
  const sortedDates = useMemo(
    () => [...grouped.keys()].sort((a, b) => b.localeCompare(a)),
    [grouped],
  );

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      {/* Header */}
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Movimientos de Caja</Text>
        <Text className="mt-1 text-sm text-[#1A1A1A]/60">
          Registro de ingresos y egresos.
        </Text>
      </View>

      {/* Balance card */}
      <View className="mx-4 mb-6 rounded-lg border border-[#E2E2DC] bg-white p-4">
        <Text className="text-sm text-[#1A1A1A]/60">Saldo actual</Text>
        {balanceLoading ? (
          <View className="mt-2 h-8 w-32 bg-[#F0F0EC] rounded-md" />
        ) : (
          <Text className={`mt-1 text-3xl font-bold ${(balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatPrice(balance ?? 0)}
          </Text>
        )}
        <Text className="mt-1 text-xs text-[#1A1A1A]/40">
          {typeFilter
            ? `Mostrando solo ${typeFilter === 'income' ? 'ingresos' : 'egresos'}`
            : 'Todos los movimientos'}
        </Text>
      </View>

      {/* Filters */}
      <View className="px-4 mb-4 gap-3">
        {/* Date range */}
        <View className="flex-row gap-2">
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

        {/* Type filter */}
        <Select
          label="Tipo"
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_OPTIONS}
          placeholder="Todos"
        />
      </View>

      {/* Error state */}
      {isError && (
        <View className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-700">Error al cargar los movimientos.</Text>
        </View>
      )}

      {/* Timeline */}
      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-24 rounded-lg bg-[#F0F0EC]" />
          ))}
        </View>
      ) : sortedDates.length === 0 ? (
        <View className="mx-4 items-center justify-center rounded-lg border border-[#E2E2DC] bg-white py-16">
          <Text className="text-sm font-medium text-[#1A1A1A]/50">
            {typeFilter
              ? 'No hay movimientos del tipo seleccionado.'
              : 'No hay movimientos registrados.'}
          </Text>
          <Text className="mt-1 text-xs text-[#1A1A1A]/30">
            Los movimientos se generan automáticamente al crear órdenes, gastos o compras.
          </Text>
        </View>
      ) : (
        <View className="px-4 gap-6">
          {sortedDates.map((date) => (
            <View key={date}>
              {/* Date heading */}
              <Text className="mb-3 text-sm font-semibold text-[#1A1A1A]/60">
                {formatDate(date)}
              </Text>

              {/* Movements for this date */}
              <View className="gap-3">
                {(grouped.get(date) ?? []).map((movement) => {
                  const isIncome = movement.type === 'income';
                  return (
                    <View
                      key={movement.id}
                      className="rounded-lg border border-[#E2E2DC] bg-white p-4"
                    >
                      <View className="flex-row items-start gap-3">
                        {/* Type icon */}
                        <View
                          className={`h-10 w-10 rounded-full items-center justify-center ${
                            isIncome ? 'bg-emerald-50' : 'bg-red-50'
                          }`}
                        >
                          <Text className={`text-lg ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isIncome ? '↑' : '↓'}
                          </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1 min-w-0">
                          <Text className="text-sm font-medium text-[#1A1A1A]">
                            {movement.description}
                          </Text>
                          <View className="flex-row flex-wrap items-center gap-x-2 mt-0.5">
                            {movement.referenceType && (
                              <Text className="text-xs text-[#1A1A1A]/40">
                                {movement.referenceType === 'order'
                                  ? 'Orden de venta'
                                  : movement.referenceType === 'expense'
                                    ? 'Gasto registrado'
                                    : movement.referenceType === 'purchase'
                                      ? 'Compra a proveedor'
                                      : movement.referenceType}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Amount */}
                        <View className="items-end">
                          <Text className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isIncome ? '+' : '-'}{formatPrice(movement.amount)}
                          </Text>
                          <View className={`px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            <Text className={`text-xs font-medium ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                              {isIncome ? 'Ingreso' : 'Egreso'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
