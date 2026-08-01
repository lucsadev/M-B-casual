/**
 * Compras a Proveedores — /admin/compras
 *
 * Ported from web's features/finance/pages/purchases-page.tsx
 * Uses new finance feature hooks with camelCase types.
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import DatePicker from '../../components/DatePicker';
import {
  usePurchases,
  useCreatePurchase,
  useConfirmPurchase,
} from '../../features/finance/hooks/use-finance';

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-AR');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR');
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function statusLabel(status: string): string {
  switch (status) {
    case 'confirmed': return 'Confirmada';
    case 'cancelled': return 'Cancelada';
    default: return 'Pendiente';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-700';
    case 'cancelled': return 'bg-red-50 text-red-700';
    default: return 'bg-amber-50 text-amber-700';
  }
}

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
// Hooks
// ---------------------------------------------------------------------------

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
        id: string; product_id: string; quantity: number; unit_cost: number; subtotal: number;
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
// Screen
// ---------------------------------------------------------------------------

export default function AdminPurchasesScreen() {
  // Filters
  const defaultFrom = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(todayISO);
  const [supplierFilter, setSupplierFilter] = useState('');

  // Fetch
  const { data: purchases, isLoading, isError } = usePurchases({
    fechaDesde: dateFrom,
    fechaHasta: dateTo,
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

  const { data: detailItems, isLoading: detailLoading } = usePurchaseItems(showDetail);

  // ---------------------------------------------------------------------------
  // Line item management
  // ---------------------------------------------------------------------------

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { productId: '', productName: '', variantId: null, variantLabel: null, quantity: 1, unitCost: 0 },
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

    const hasSingleVariant = product.variants.length === 1 && product.variants[0].label !== '';

    updateLineItem(index, {
      productId,
      productName: product.name,
      variantId: hasSingleVariant ? product.variants[0].id : null,
      variantLabel: hasSingleVariant ? product.variants[0].label : null,
    });
  }

  // ---------------------------------------------------------------------------
  // Create / Confirm handlers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setForm({ supplierName: '', invoiceNumber: '', notes: '', purchaseDate: todayISO() });
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

  async function handleConfirm(id: string) {
    await confirmPurchase.mutateAsync(id);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      {/* Header */}
      <View className="px-4 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-[#1A1A1A]">Compras a Proveedores</Text>
          <Text className="mt-1 text-sm text-[#1A1A1A]/60">
            Compras a proveedores y reposición de stock.
          </Text>
        </View>
        <TouchableOpacity onPress={openCreate} className="bg-[#1A1A1A] px-4 py-2.5 rounded-lg">
          <Text className="text-sm font-medium text-white">+ Nueva</Text>
        </TouchableOpacity>
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
        {/* Supplier filter */}
        <TextInput
          value={supplierFilter}
          onChangeText={setSupplierFilter}
          placeholder="Buscar por proveedor..."
          className="border border-[#E2E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1A1A]"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Error state */}
      {isError && (
        <View className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-700">Error al cargar las compras.</Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View className="px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-20 rounded-md bg-[#F0F0EC]" />
          ))}
        </View>
      )}

      {/* Empty */}
      {!isLoading && (!purchases || purchases.length === 0) && (
        <View className="mx-4 items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <Text className="text-sm text-[#1A1A1A]/50">
            {supplierFilter
              ? 'No hay compras del proveedor seleccionado.'
              : 'No hay compras registradas.'}
          </Text>
        </View>
      )}

      {/* Purchase list */}
      {!isLoading && purchases && purchases.length > 0 && (
        <View className="px-4 gap-2">
          {purchases.map((purchase) => (
            <View key={purchase.id} className="rounded-lg border border-[#E2E2DC] bg-white p-3">
              <View className="flex-row justify-between items-start mb-1">
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-medium text-[#1A1A1A]">
                    {purchase.supplierName}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-xs text-[#1A1A1A]/40">
                      {formatDate(purchase.purchaseDate)}
                    </Text>
                    {purchase.invoiceNumber && (
                      <Text className="text-xs text-[#1A1A1A]/40">
                        · Factura: {purchase.invoiceNumber}
                      </Text>
                    )}
                  </View>
                </View>
                <Text className="text-sm font-bold text-[#1A1A1A]">
                  {formatPrice(purchase.total)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-[#E2E2DC]/50">
                <View className={`px-2 py-0.5 rounded-full ${statusColor(purchase.status)}`}>
                  <Text className="text-xs font-medium">
                    {statusLabel(purchase.status)}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setShowDetail(purchase.id)}
                    className="bg-[#F0F0EC] px-3 py-1 rounded-full"
                  >
                    <Text className="text-xs font-medium text-[#E8836B]">Detalle</Text>
                  </TouchableOpacity>
                  {purchase.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleConfirm(purchase.id)}
                      disabled={confirmPurchase.isPending}
                      className="border border-emerald-200 px-3 py-1 rounded-full"
                    >
                      <Text className="text-xs font-medium text-emerald-600">Confirmar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ================================================================== */}
      {/* CREATE PURCHASE MODAL */}
      {/* ================================================================== */}
      <Modal
        visible={showCreate}
        transparent
        animationType="none"
        onRequestClose={() => setShowCreate(false)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/40 justify-center px-4">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-white rounded-2xl p-6 max-h-[85%]">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-[#1A1A1A]">Nueva compra a proveedor</Text>
                <TouchableOpacity onPress={() => setShowCreate(false)}>
                  <Text className="text-lg text-[#1A1A1A]/40">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="gap-4">
                {/* Supplier + Invoice */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#1A1A1A]/80 mb-1">Proveedor *</Text>
                    <TextInput
                      value={form.supplierName}
                      onChangeText={(text) => setForm({ ...form, supplierName: text })}
                      placeholder="Nombre del proveedor"
                      className="border border-[#E2E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A]"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View className="w-28">
                    <Text className="text-sm font-medium text-[#1A1A1A]/80 mb-1">N° Factura</Text>
                    <TextInput
                      value={form.invoiceNumber}
                      onChangeText={(text) => setForm({ ...form, invoiceNumber: text })}
                      placeholder="0001-0001"
                      className="border border-[#E2E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A]"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Date + Total */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <DatePicker
                      label="Fecha"
                      value={form.purchaseDate}
                      onChange={(date) => setForm({ ...form, purchaseDate: date })}
                    />
                  </View>
                  <View className="w-32">
                    <Text className="text-sm font-medium text-[#1A1A1A]/80 mb-1">Total calculado</Text>
                    <View className="h-[42px] bg-[#F0F0EC] rounded-lg px-3 justify-center">
                      <Text className="text-sm font-bold text-[#1A1A1A]">{formatPrice(calculatedTotal)}</Text>
                    </View>
                  </View>
                </View>

                {/* Line items */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-[#1A1A1A]/80">Productos *</Text>
                    <TouchableOpacity
                      onPress={addLineItem}
                      disabled={productsLoading}
                      className="bg-[#F0F0EC] px-3 py-1.5 rounded-lg"
                    >
                      <Text className="text-xs font-medium text-[#1A1A1A]/70">+ Agregar</Text>
                    </TouchableOpacity>
                  </View>

                  {lineItems.length === 0 && (
                    <View className="py-6 items-center">
                      <Text className="text-sm text-[#1A1A1A]/40">Agregá al menos un producto a la compra.</Text>
                    </View>
                  )}

                  <View className="gap-3">
                    {lineItems.map((item, index) => (
                      <View key={index} className="rounded-lg border border-[#E2E2DC] p-3">
                        {/* Product selector */}
                        <View className="mb-2">
                          <Text className="text-xs text-[#1A1A1A]/60 mb-1">Producto</Text>
                          {productsLoading ? (
                            <View className="h-9 bg-[#F0F0EC] rounded-lg justify-center px-3">
                              <Text className="text-sm text-[#1A1A1A]/40">Cargando...</Text>
                            </View>
                          ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                              {(productOptions ?? []).map((p) => (
                                <TouchableOpacity
                                  key={p.id}
                                  onPress={() => handleProductSelect(index, p.id)}
                                  className={`px-3 py-2 rounded-lg ${item.productId === p.id ? 'bg-[#1A1A1A]' : 'bg-[#F0F0EC]'}`}
                                >
                                  <Text className={`text-xs ${item.productId === p.id ? 'text-white font-medium' : 'text-[#1A1A1A]/70'}`}>
                                    {p.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          )}
                        </View>

                        {/* Variant selector */}
                        {item.productId && (
                          <View className="mb-2">
                            <Text className="text-xs text-[#1A1A1A]/60 mb-1">Variante</Text>
                            {(() => {
                              const product = productOptions?.find((p) => p.id === item.productId);
                              const variants = product?.variants ?? [];
                              if (variants.length === 0) {
                                return (
                                  <View className="h-9 bg-[#F0F0EC] rounded-lg justify-center px-3">
                                    <Text className="text-xs text-[#1A1A1A]/50">Sin variantes</Text>
                                  </View>
                                );
                              }
                              return (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                  <TouchableOpacity
                                    onPress={() => updateLineItem(index, { variantId: null, variantLabel: null })}
                                    className={`px-3 py-1.5 rounded-lg ${!item.variantId ? 'bg-[#1A1A1A]' : 'bg-[#F0F0EC]'}`}
                                  >
                                    <Text className={`text-xs ${!item.variantId ? 'text-white font-medium' : 'text-[#1A1A1A]/70'}`}>
                                      Sin variante
                                    </Text>
                                  </TouchableOpacity>
                                  {variants.map((v) => (
                                    <TouchableOpacity
                                      key={v.id}
                                      onPress={() => updateLineItem(index, { variantId: v.id, variantLabel: v.label })}
                                      className={`px-3 py-1.5 rounded-lg ${item.variantId === v.id ? 'bg-[#1A1A1A]' : 'bg-[#F0F0EC]'}`}
                                    >
                                      <Text className={`text-xs ${item.variantId === v.id ? 'text-white font-medium' : 'text-[#1A1A1A]/70'}`}>
                                        {v.label}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              );
                            })()}
                          </View>
                        )}

                        {/* Quantity + Cost + Subtotal */}
                        <View className="flex-row items-center gap-2">
                          <View className="flex-1">
                            <Text className="text-xs text-[#1A1A1A]/60 mb-1">Cant.</Text>
                            <TextInput
                              value={String(item.quantity)}
                              onChangeText={(text) => updateLineItem(index, { quantity: Number(text) || 1 })}
                              keyboardType="numeric"
                              className="border border-[#E2E2DC] rounded-lg px-3 py-2 text-sm text-center text-[#1A1A1A]"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-[#1A1A1A]/60 mb-1">Costo unit.</Text>
                            <TextInput
                              value={String(item.unitCost)}
                              onChangeText={(text) => updateLineItem(index, { unitCost: Number(text) || 0 })}
                              keyboardType="numeric"
                              className="border border-[#E2E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1A1A]"
                            />
                          </View>
                          <View className="w-20">
                            <Text className="text-xs text-[#1A1A1A]/60 mb-1">Subtotal</Text>
                            <View className="h-[42px] bg-[#F0F0EC] rounded-lg px-2 justify-center items-center">
                              <Text className="text-xs font-medium text-[#1A1A1A]/80">
                                {formatPrice(item.quantity * item.unitCost)}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => removeLineItem(index)} className="mb-0.5 self-end w-9 h-9 items-center justify-center rounded-md">
                            <Text className="text-base text-red-400">✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>

                  {formError && <Text className="text-sm text-red-500 mt-1">{formError}</Text>}
                </View>

                {/* Notes */}
                <View>
                  <Text className="text-sm font-medium text-[#1A1A1A]/80 mb-1">Notas</Text>
                  <TextInput
                    value={form.notes}
                    onChangeText={(text) => setForm({ ...form, notes: text })}
                    placeholder="Notas opcionales..."
                    multiline
                    numberOfLines={2}
                    className="border border-[#E2E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] min-h-[60px]"
                    placeholderTextColor="#9CA3AF"
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              {/* Actions */}
              <View className="flex-row gap-3 mt-4 pt-4 border-t border-[#E2E2DC]">
                <TouchableOpacity
                  onPress={() => setShowCreate(false)}
                  className="flex-1 border border-[#E2E2DC] rounded-lg py-2.5 items-center"
                >
                  <Text className="text-sm font-medium text-[#1A1A1A]/70">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={createPurchase.isPending || !form.supplierName.trim() || lineItems.length === 0}
                  className="flex-1 bg-[#1A1A1A] rounded-lg py-2.5 items-center"
                >
                  {createPurchase.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-sm font-medium text-white">
                      Guardar ({formatPrice(calculatedTotal)})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ================================================================== */}
      {/* PURCHASE DETAIL MODAL */}
      {/* ================================================================== */}
      <Modal
        visible={!!showDetail}
        transparent
        animationType="none"
        onRequestClose={() => setShowDetail(null)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/40 justify-center px-4">
          <View className="bg-white rounded-2xl p-6 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#1A1A1A]">Detalle de compra</Text>
              <TouchableOpacity onPress={() => setShowDetail(null)}>
                <Text className="text-lg text-[#1A1A1A]/40">✕</Text>
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View className="gap-3 py-4">
                {[1, 2, 3].map((i) => <View key={i} className="h-10 rounded-md bg-[#F0F0EC]" />)}
              </View>
            ) : detailItems && detailItems.length > 0 ? (
              <>
                <ScrollView className="gap-2">
                  <View className="flex-row px-2 pb-2 border-b border-[#E2E2DC]">
                    <Text className="flex-[2] text-xs font-medium text-[#1A1A1A]/60">Producto</Text>
                    <Text className="flex-1 text-xs font-medium text-[#1A1A1A]/60 text-center">Cant.</Text>
                    <Text className="flex-1 text-xs font-medium text-[#1A1A1A]/60 text-right">Costo u.</Text>
                    <Text className="flex-1 text-xs font-medium text-[#1A1A1A]/60 text-right">Subtotal</Text>
                  </View>
                  {detailItems.map((item) => (
                    <View key={item.id} className="flex-row px-2 py-2 border-b border-[#E2E2DC]/50">
                      <Text className="flex-[2] text-sm font-medium text-[#1A1A1A]">{item.product_name}</Text>
                      <Text className="flex-1 text-sm text-[#1A1A1A]/80 text-center">{item.quantity}</Text>
                      <Text className="flex-1 text-sm text-[#1A1A1A]/80 text-right">{formatPrice(item.unitCost)}</Text>
                      <Text className="flex-1 text-sm font-semibold text-[#1A1A1A] text-right">{formatPrice(item.subtotal)}</Text>
                    </View>
                  ))}
                  <View className="flex-row px-2 py-3 mt-2">
                    <Text className="flex-[3] text-sm font-bold text-[#1A1A1A]">Total</Text>
                    <Text className="flex-1 text-sm font-bold text-[#1A1A1A] text-right">
                      {formatPrice(detailItems.reduce((sum, item) => sum + item.subtotal, 0))}
                    </Text>
                  </View>
                </ScrollView>
                <TouchableOpacity onPress={() => setShowDetail(null)} className="mt-4 border border-[#E2E2DC] rounded-lg py-2.5 items-center">
                  <Text className="text-sm font-medium text-[#1A1A1A]/70">Cerrar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="py-8 items-center">
                  <Text className="text-sm text-[#1A1A1A]/40">No se encontraron items para esta compra.</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDetail(null)} className="border border-[#E2E2DC] rounded-lg py-2.5 items-center">
                  <Text className="text-sm font-medium text-[#1A1A1A]/70">Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
