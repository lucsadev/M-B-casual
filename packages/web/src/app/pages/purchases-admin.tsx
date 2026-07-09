/**
 * Admin Purchases Page
 *
 * Route: /admin/compras
 * Displays supplier purchases with the ability to:
 * - View purchase history with pagination
 * - Register new purchases with line items (product + variant + quantity + cost)
 * - Stock is automatically updated on save via DB trigger
 * - View purchase detail with items
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  usePurchases,
  useCreatePurchase,
} from '@/features/admin/finance/api/use-finance-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_label: string | null;
  quantity: number;
  unit_cost: number;
}

interface PurchaseItemRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_cost: number;
  subtotal: number;
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

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch all active products with their variants for the line item selector */
function useProductOptions() {
  return useQuery<ProductOption[]>({
    queryKey: ['admin', 'products', 'options'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Fetch variants for all products
      const { data: variants, error: vError } = await supabase
        .from('product_variants')
        .select('id, product_id, size, color');

      if (vError) throw vError;

      const options: ProductOption[] = ((products ?? []) as Array<{ id: string; name: string }>).map((p) => ({
        id: p.id,
        name: p.name,
        variants: ((variants ?? []) as Array<{ id: string; product_id: string; size: string | null; color: string | null }>)
          .filter((v) => v.product_id === p.id)
          .map((v) => ({
            id: v.id,
            label: [v.size, v.color].filter(Boolean).join(' - ') || 'Único',
          })),
      }));

      return options;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/** Fetch purchase items for a specific purchase (for detail view) */
function usePurchaseItems(purchaseId: string | null) {
  return useQuery<(PurchaseItemRow & { product_name: string })[]>({
    queryKey: ['admin', 'purchases', 'items', purchaseId],
    queryFn: async () => {
      if (!purchaseId) return [];

      // Fetch purchase items with product names via a join
      const { data: items, error } = await supabase
        .from('purchase_items')
        .select('id, product_id, variant_id, quantity, unit_cost, subtotal')
        .eq('purchase_id', purchaseId);

      if (error) throw error;

      const rawItems = (items ?? []) as PurchaseItemRow[];

      // Fetch product names separately to avoid TypeScript issues with joins
      const productIds = [...new Set(rawItems.map((i) => i.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      const productMap = new Map(
        ((products ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]),
      );

      return rawItems.map((item) => ({
        ...item,
        product_name: productMap.get(item.product_id) ?? 'Producto',
      }));
    },
    enabled: !!purchaseId,
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function AdminPurchasesPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    supplierName: '',
    invoiceNumber: '',
    notes: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const { data, isLoading } = usePurchases(page);
  const createPurchase = useCreatePurchase();
  const { data: productOptions, isLoading: productsLoading } =
    useProductOptions();
  const { data: detailItems, isLoading: detailLoading } =
    usePurchaseItems(showDetail);

  // ------------------------------------------------------------------
  // Line item management
  // ------------------------------------------------------------------

  function addLineItem() {
    setLineItems([
      ...lineItems,
      {
        product_id: '',
        product_name: '',
        variant_id: null,
        variant_label: null,
        quantity: 1,
        unit_cost: 0,
      },
    ]);
  }

  function updateLineItem(index: number, updates: Partial<LineItem>) {
    setLineItems(
      lineItems.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  const calculatedTotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0,
  );

  // ------------------------------------------------------------------
  // Create purchase
  // ------------------------------------------------------------------

  async function handleCreate() {
    if (!form.supplierName || lineItems.length === 0) return;

    await createPurchase.mutateAsync({
      supplier_name: form.supplierName,
      invoice_number: form.invoiceNumber || undefined,
      total: calculatedTotal,
      notes: form.notes || undefined,
      purchase_date: form.purchaseDate,
      items: lineItems.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? undefined,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      })),
    });

    // Reset form
    setShowCreate(false);
    setForm({
      supplierName: '',
      invoiceNumber: '',
      notes: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setLineItems([]);
  }

  // ------------------------------------------------------------------
  // Handle product selection — auto-fill variant if only one
  // ------------------------------------------------------------------

  function handleProductSelect(index: number, productId: string) {
    const product = productOptions?.find((p) => p.id === productId);
    if (!product) return;

    const hasSingleVariant =
      product.variants.length === 1 && product.variants[0].label !== '';

    updateLineItem(index, {
      product_id: productId,
      product_name: product.name,
      variant_id: hasSingleVariant ? product.variants[0].id : null,
      variant_label: hasSingleVariant ? product.variants[0].label : null,
    });
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Compras</h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Compras a proveedores y reposición de stock.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          + Nueva compra
        </Button>
      </div>

      {/* Purchases Table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-24">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data && data.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-[#1A1A1A]/50"
                >
                  No hay compras registradas.
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {new Date(purchase.purchase_date).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell className="font-medium">
                  {purchase.supplier_name}
                </TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {purchase.invoice_number || '—'}
                </TableCell>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetail(purchase.id)}
                    className="text-[#E8836B] hover:text-[#E8836B]/80"
                  >
                    Ver items
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(purchase.total)}
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-[#1A1A1A]/60">
                  {purchase.notes || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1A1A1A]/60">
            Página {data.page} de {data.totalPages} ({data.total} compras)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CREATE PURCHASE DIALOG */}
      {/* ================================================================ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva compra a proveedor</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Supplier info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Proveedor *</Label>
                <Input
                  id="supplier"
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <Label htmlFor="invoice">N° Factura</Label>
                <Input
                  id="invoice"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumber: e.target.value })
                  }
                  placeholder="0001-000001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">Fecha</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
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
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs">Producto</Label>
                      <Select
                        value={item.product_id}
                        onChange={(e) =>
                          handleProductSelect(index, e.target.value)
                        }
                        options={
                          productOptions?.map((p) => ({
                            value: p.id,
                            label: p.name,
                          })) ?? []
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Variant selector */}
                    {item.product_id && (
                      <div className="w-28">
                        <Label className="text-xs">Variante</Label>
                        <Select
                          value={item.variant_id ?? ''}
                          onChange={(e) => {
                            const product = productOptions?.find(
                              (p) => p.id === item.product_id,
                            );
                            const variant = product?.variants.find(
                              (v) => v.id === e.target.value,
                            );
                            updateLineItem(index, {
                              variant_id: e.target.value || null,
                              variant_label: variant?.label ?? null,
                            });
                          }}
                          options={[
                            { value: '', label: 'Sin variante' },
                            ...(
                              productOptions?.find(
                                (p) => p.id === item.product_id,
                              )?.variants ?? []
                            ).map((v) => ({
                              value: v.id,
                              label: v.label,
                            })),
                          ]}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="w-20">
                      <Label className="text-xs">Cant.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, {
                            quantity: Number(e.target.value) || 1,
                          })
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
                        value={item.unit_cost}
                        onChange={(e) =>
                          updateLineItem(index, {
                            unit_cost: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-24">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="mt-1 h-10 rounded-md bg-[#F0F0EC] px-3 text-sm font-medium leading-10 text-[#1A1A1A]/80">
                        {formatPrice(item.quantity * item.unit_cost)}
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
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="purchaseNotes">Notas</Label>
              <Textarea
                id="purchaseNotes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              disabled={
                createPurchase.isPending ||
                !form.supplierName ||
                lineItems.length === 0
              }
            >
              {createPurchase.isPending
                ? 'Guardando...'
                : `Guardar compra (${formatPrice(calculatedTotal)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* PURCHASE DETAIL DIALOG */}
      {/* ================================================================ */}
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
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detailItems as any[]).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatPrice(item.unit_cost)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between border-t border-[#E2E2DC] pt-3">
                <span className="font-semibold text-[#1A1A1A]">Total</span>
                <span className="font-bold text-[#1A1A1A]">
                  {formatPrice(
                    detailItems.reduce(
                      (sum: number, item: any) => sum + item.subtotal,
                      0,
                    ),
                  )}
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
