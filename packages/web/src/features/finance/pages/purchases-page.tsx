/**
 * PurchasesPage — CRUD for supplier purchases at /admin/compras.
 *
 * Features:
 * - Supplier name + date range filters
 * - Table: supplier, invoice, date, total, status, actions
 * - Create purchase with dynamic line items (product + variant + qty + cost)
 * - Auto-calculated subtotals and total
 * - Confirm purchase button (triggers stock update via DB trigger)
 * - Detail dialog with line items
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  usePurchases,
  useCreatePurchase,
  useConfirmPurchase,
} from '../hooks/use-finance';
import { DateRangeFilter } from '../components/date-range-filter';
import type { DateRange } from '../components/date-range-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Purchase, PurchaseItem } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  unitCost: number;
}

interface ProductOption {
  id: string;
  name: string;
  variants: { id: string; label: string }[];
}

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
  return new Date(iso).toLocaleDateString('es-AR');
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function statusLabel(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Pendiente';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700';
    case 'cancelled':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch active products with variants for the line item selector */
function useProductOptions() {
  return useQuery<ProductOption[]>({
    queryKey: ['finance', 'products', 'options'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const { data: variants, error: vError } = await supabase
        .from('product_variants')
        .select('id, product_id, size, color');

      if (vError) throw vError;

      return ((products ?? []) as Array<{ id: string; name: string }>).map((p) => ({
        id: p.id,
        name: p.name,
        variants: ((variants ?? []) as Array<{ id: string; product_id: string; size: string | null; color: string | null }>)
          .filter((v) => v.product_id === p.id)
          .map((v) => ({
            id: v.id,
            label: [v.size, v.color].filter(Boolean).join(' - ') || 'Único',
          })),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch purchase items for detail view */
function usePurchaseItems(purchaseId: string | null) {
  return useQuery<{ id: string; quantity: number; unitCost: number; subtotal: number; product_name: string }[]>({
    queryKey: ['finance', 'purchases', 'items', purchaseId],
    queryFn: async () => {
      if (!purchaseId) return [];

      const { data: items, error } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', purchaseId);

      if (error) throw error;

      const rawItems = (items ?? []) as Array<{
        id: string;
        product_id: string;
        quantity: number;
        unit_cost: number;
        subtotal: number;
      }>;

      const productIds = [...new Set(rawItems.map((i) => i.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      const productMap = new Map(
        ((products ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]),
      );

      return rawItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitCost: item.unit_cost,
        subtotal: item.subtotal,
        product_name: productMap.get(item.product_id) ?? 'Producto',
      }));
    },
    enabled: !!purchaseId,
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function PurchasesPage() {
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return { from, to: todayISO() };
  });
  const [supplierFilter, setSupplierFilter] = useState('');

  // Fetch
  const { data: purchases, isLoading, isError } = usePurchases({
    fechaDesde: dateRange.from,
    fechaHasta: dateRange.to,
    proveedor: supplierFilter || undefined,
  });

  // Mutations
  const createPurchase = useCreatePurchase();
  const confirmPurchase = useConfirmPurchase();
  const { data: productOptions, isLoading: productsLoading } = useProductOptions();

  // Dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    supplierName: '',
    invoiceNumber: '',
    notes: '',
    purchaseDate: todayISO(),
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail items
  const { data: detailItems, isLoading: detailLoading } = usePurchaseItems(showDetail);

  // ---------------------------------------------------------------------------
  // Line item management
  // ---------------------------------------------------------------------------

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        productId: '',
        productName: '',
        variantId: null,
        variantLabel: null,
        quantity: 1,
        unitCost: 0,
      },
    ]);
  }

  function updateLineItem(index: number, updates: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const calculatedTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    [lineItems],
  );

  function handleProductSelect(index: number, productId: string) {
    const product = productOptions?.find((p) => p.id === productId);
    if (!product) return;

    const hasSingleVariant =
      product.variants.length === 1 && product.variants[0].label !== '';

    updateLineItem(index, {
      productId,
      productName: product.name,
      variantId: hasSingleVariant ? product.variants[0].id : null,
      variantLabel: hasSingleVariant ? product.variants[0].label : null,
    });
  }

  // ---------------------------------------------------------------------------
  // Create purchase
  // ---------------------------------------------------------------------------

  function openCreate() {
    setForm({
      supplierName: '',
      invoiceNumber: '',
      notes: '',
      purchaseDate: todayISO(),
    });
    setLineItems([]);
    setFormError(null);
    setShowCreate(true);
  }

  async function handleCreate() {
    setFormError(null);

    if (!form.supplierName.trim()) {
      setFormError('El nombre del proveedor es obligatorio.');
      return;
    }
    if (lineItems.length === 0) {
      setFormError('Debe agregar al menos un producto.');
      return;
    }

    await createPurchase.mutateAsync({
      supplierName: form.supplierName.trim(),
      invoiceNumber: form.invoiceNumber || undefined,
      total: calculatedTotal,
      notes: form.notes || undefined,
      purchaseDate: form.purchaseDate,
      items: lineItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    });

    setShowCreate(false);
  }

  // ---------------------------------------------------------------------------
  // Confirm purchase
  // ---------------------------------------------------------------------------

  async function handleConfirm(id: string) {
    await confirmPurchase.mutateAsync(id);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] lg:text-3xl">
            Compras a Proveedores
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Compras a proveedores y reposición de stock.
          </p>
        </div>
        <Button onClick={openCreate}>+ Nueva compra</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="w-full lg:w-56">
          <Label className="mb-1 block text-xs font-medium text-[#1A1A1A]/60">
            Proveedor
          </Label>
          <Input
            value={supplierFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierFilter(e.target.value)}
            placeholder="Buscar por proveedor..."
            className="h-9"
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error al cargar las compras. Intentalo de nuevo.
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-36 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading */}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Empty */}
            {!isLoading && (!purchases || purchases.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-[#1A1A1A]/50">
                  {supplierFilter
                    ? 'No hay compras del proveedor seleccionado.'
                    : 'No hay compras registradas.'}
                </TableCell>
              </TableRow>
            )}

            {/* Rows */}
            {purchases?.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {formatDate(purchase.purchaseDate)}
                </TableCell>
                <TableCell className="font-medium text-[#1A1A1A]">
                  {purchase.supplierName}
                </TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {purchase.invoiceNumber || '—'}
                </TableCell>
                <TableCell className="font-medium text-[#1A1A1A]">
                  {formatPrice(purchase.total)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor((purchase as any).status || 'pending')}`}
                  >
                    {statusLabel((purchase as any).status || 'pending')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetail(purchase.id)}
                      className="text-[#E8836B] hover:text-[#E8836B]/80"
                    >
                      Detalle
                    </Button>
                    {(purchase as any).status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirm(purchase.id)}
                        disabled={confirmPurchase.isPending}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        Confirmar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ================================================================== */}
      {/* CREATE PURCHASE DIALOG */}
      {/* ================================================================== */}
      <Dialog
        open={showCreate}
        onOpenChange={(open: boolean) => { if (!open) setShowCreate(false); }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva compra a proveedor</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Supplier info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p-supplier">Proveedor *</Label>
                <Input
                  id="p-supplier"
                  value={form.supplierName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, supplierName: e.target.value })}
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <Label htmlFor="p-invoice">N° Factura</Label>
                <Input
                  id="p-invoice"
                  value={form.invoiceNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, invoiceNumber: e.target.value })}
                  placeholder="0001-000001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p-date">Fecha</Label>
                <Input
                  id="p-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Total calculado</Label>
                <div className="mt-1 flex h-10 items-center rounded-md border border-[#E2E2DC] bg-[#F0F0EC] px-3 text-sm font-semibold text-[#1A1A1A]">
                  {formatPrice(calculatedTotal)}
                </div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Productos *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  disabled={productsLoading}
                >
                  + Agregar producto
                </Button>
              </div>

              {lineItems.length === 0 && (
                <p className="py-4 text-center text-sm text-[#1A1A1A]/40">
                  Agregá al menos un producto a la compra.
                </p>
              )}

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-2 rounded-md border border-[#E2E2DC] p-3"
                  >
                    {/* Product selector */}
                    <div className="min-w-[180px] flex-1">
                      <Label className="text-xs">Producto</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value: string) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productOptions?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Variant selector */}
                    {item.productId && (
                      <div className="w-28">
                        <Label className="text-xs">Variante</Label>
                        <Select
                          value={item.variantId ?? '__none__'}
                          onValueChange={(value: string) => {
                            const selected = value === '__none__' ? '' : value;
                            const product = productOptions?.find(
                              (p) => p.id === item.productId,
                            );
                            const variant = product?.variants.find(
                              (v) => v.id === selected,
                            );
                            updateLineItem(index, {
                              variantId: selected || null,
                              variantLabel: variant?.label ?? null,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sin variante" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin variante</SelectItem>
                            {(productOptions?.find((p) => p.id === item.productId)?.variants ?? []).map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="w-20">
                      <Label className="text-xs">Cant.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateLineItem(index, { quantity: Number(e.target.value) || 1 })
                        }
                        className="text-center"
                      />
                    </div>

                    {/* Unit cost */}
                    <div className="w-28">
                      <Label className="text-xs">Costo unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.unitCost}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateLineItem(index, { unitCost: Number(e.target.value) || 0 })
                        }
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-24">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="mt-1 flex h-10 items-center rounded-md bg-[#F0F0EC] px-3 text-sm font-medium text-[#1A1A1A]/80">
                        {formatPrice(item.quantity * item.unitCost)}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeLineItem(index)}
                      className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-md text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {formError && (
                <p className="mt-2 text-sm text-red-500">{formError}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="p-notes">Notas</Label>
              <Textarea
                id="p-notes"
                value={form.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas opcionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createPurchase.isPending || !form.supplierName.trim() || lineItems.length === 0}
            >
              {createPurchase.isPending
                ? 'Guardando...'
                : `Guardar compra (${formatPrice(calculatedTotal)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* PURCHASE DETAIL DIALOG */}
      {/* ================================================================== */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle de compra</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : detailItems && detailItems.length > 0 ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>Costo unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-[#1A1A1A]">
                        {item.product_name}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatPrice(item.unitCost)}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1A1A1A]">
                        {formatPrice(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between border-t border-[#E2E2DC] pt-3">
                <span className="font-semibold text-[#1A1A1A]">Total</span>
                <span className="font-bold text-[#1A1A1A]">
                  {formatPrice(detailItems.reduce((sum, item) => sum + item.subtotal, 0))}
                </span>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#1A1A1A]/40">
              No se encontraron items para esta compra.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}