/**
 * Profitability Table — product-level margin and profitability data.
 *
 * Displays a sortable table with columns:
 * - Producto, Unidades vendidas, Ingresos, Costo compras, Margen, Rentabilidad %
 *
 * Color-coded badges indicate profitability level:
 * - ✅ Green: >40%
 * - ⚠️ Amber: 20–40%
 * - 🔴 Red: <20%
 *
 * Loading state renders skeleton rows; empty state shows a "no data" message.
 */
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice } from '@mbt/shared';
import type { ProductProfitabilityRow } from '../api/queries';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = keyof Pick<
  ProductProfitabilityRow,
  'name' | 'units_sold' | 'total_revenue' | 'estimated_cogs' | 'gross_profit' | 'margin_percent'
>;

interface SortConfig {
  field: SortField;
  direction: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the badge variant based on margin percent threshold.
 */
function getMarginBadgeVariant(
  marginPercent: number,
): 'success' | 'secondary' | 'destructive' {
  if (marginPercent > 40) return 'success';
  if (marginPercent >= 20) return 'secondary';
  return 'destructive';
}

/**
 * Column definition for sortable headers.
 */
interface ColumnDef {
  field: SortField;
  label: string;
  align?: 'left' | 'right';
  format?: (value: number) => string;
}

const COLUMNS: ColumnDef[] = [
  { field: 'name', label: 'Producto' },
  { field: 'units_sold', label: 'Unidades vendidas', align: 'right' },
  { field: 'total_revenue', label: 'Ingresos', align: 'right', format: formatPrice },
  { field: 'estimated_cogs', label: 'Costo compras', align: 'right', format: formatPrice },
  { field: 'gross_profit', label: 'Margen', align: 'right', format: formatPrice },
  { field: 'margin_percent', label: 'Rentabilidad', align: 'right' },
];

// ---------------------------------------------------------------------------
// Sortable header
// ---------------------------------------------------------------------------

interface SortableHeaderProps {
  column: ColumnDef;
  sort: SortConfig;
  onSort: (field: SortField) => void;
}

function SortableHeader({ column, sort, onSort }: SortableHeaderProps) {
  const isActive = sort.field === column.field;

  return (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap text-xs uppercase tracking-wider ${
        column.align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(column.field)}
    >
      <span className="inline-flex items-center gap-1">
        {column.label}
        {isActive && (
          <span className="text-[#D4A853]">
            {sort.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </span>
    </TableHead>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export interface ProfitabilityTableProps {
  /** Product profitability data (undefined while loading) */
  data: ProductProfitabilityRow[] | undefined;
  /** Whether data is currently loading */
  loading: boolean;
}

/**
 * Sortable table displaying per-product profitability metrics.
 *
 * Columns: Producto, Unidades vendidas, Ingresos, Costo compras, Margen, Rentabilidad %
 * Sorting toggles asc/desc on column click. Secondary badge variant indicates default.
 */
export function ProfitabilityTable({ data, loading }: ProfitabilityTableProps) {
  const [sort, setSort] = useState<SortConfig>({
    field: 'margin_percent',
    direction: 'desc',
  });

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      if (aVal == null || bVal == null) return 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sort.direction === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, sort]);

  return (
    <div className="rounded-lg border border-[#E8E4D9] bg-white">
      {loading ? (
        <div className="p-6">
          <Skeleton className="mb-4 h-5 w-48" />
          <TableSkeleton />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-[#1A1A1A]/40">
            No hay datos de rentabilidad para mostrar.
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-[#E8E4D9] px-6 py-4">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Rentabilidad por producto
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F5F0]">
                  {COLUMNS.map((col) => (
                    <SortableHeader
                      key={col.field}
                      column={col}
                      sort={sort}
                      onSort={handleSort}
                    />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-[#1A1A1A]">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#1A1A1A]/70">
                      {row.units_sold}
                    </TableCell>
                    <TableCell className="text-right font-medium text-[#1A1A1A]">
                      {formatPrice(row.total_revenue)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#1A1A1A]/70">
                      {formatPrice(row.estimated_cogs)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-[#1A1A1A]">
                      {formatPrice(row.gross_profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getMarginBadgeVariant(row.margin_percent)}>
                        {row.margin_percent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
