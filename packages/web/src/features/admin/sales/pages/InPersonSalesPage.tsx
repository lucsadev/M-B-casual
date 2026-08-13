/**
 * InPersonSalesPage — Admin page for in-person sales management.
 *
 * Features:
 * - Customer list with search and balance display
 * - Create new customers
 * - Create new sales with products, discounts, and payment tracking
 * - Balance tracking for partial payments
 * - Pack product support: N-slot picker with split pricing (design 5.4)
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, ShoppingCart, UserPlus, Edit, X, Eye, HandCoins } from 'lucide-react';
import { formatPrice, splitPackPrice, getAvailableSizes, getAvailableColors, getInStockVariants, resolveInStockVariantId } from '@mbt/shared';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InPersonCustomer = Database['public']['Tables']['in_person_customers']['Row'];
type InPersonSale = Database['public']['Tables']['in_person_sales']['Row'];

interface SaleItem {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function fetchCustomers(search: string): Promise<InPersonCustomer[]> {
  let query = supabase
    .from('in_person_customers')
    .select('*')
    .order('name', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

interface CustomerSale {
  id: string;
  total: number;
  discount: number;
  amount_paid: number;
  balance_used: number;
  payment_method: string;
  created_at: string;
  items: Array<{
    product_name: string;
    variant_label: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

async function fetchCustomerSales(customerId: string): Promise<CustomerSale[]> {
  const { data, error } = await supabase
    .from('in_person_sales')
    .select(`
      id,
      total,
      discount,
      amount_paid,
      balance_used,
      payment_method,
      created_at,
      in_person_sale_items (
        quantity,
        unit_price,
        subtotal,
        products (name),
        product_variants (size, color)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((sale) => ({
    id: sale.id,
    type: 'sale',
    total: sale.total,
    discount: sale.discount,
    amount_paid: sale.amount_paid,
    balance_used: sale.balance_used,
    payment_method: sale.payment_method,
    created_at: sale.created_at,
    items: (sale.in_person_sale_items ?? []).map((item) => ({
      product_name: (item.products as any)?.name ?? 'Producto',
      variant_label: [
        (item.product_variants as any)?.size,
        (item.product_variants as any)?.color,
      ].filter(Boolean).join(' / ') || 'Sin variante',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    })),
  }));
}

interface CustomerPayment {
  id: string;
  type: 'payment';
  amount: number;
  payment_method: string;
  description: string | null;
  created_at: string;
}

async function fetchCustomerPayments(customerId: string): Promise<CustomerPayment[]> {
  const { data, error } = await supabase
    .from('cash_movements')
    .select('id, amount, description, created_at')
    .eq('reference_type', 'debt_collection')
    .eq('reference_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((movement) => ({
    id: movement.id,
    type: 'payment' as const,
    amount: movement.amount,
    payment_method: 'efectivo', // cash_movements doesn't have payment_method, default to efectivo
    description: movement.description,
    created_at: movement.created_at,
  }));
}
interface ProductWithVariants {
  id: string;
  name: string;
  price: number;
  pack_units: number | null;
  variants: Array<{
    id: string;
    size: string | null;
    color: string | null;
    discount: number;
    stock: number;
  }>;
}

async function fetchProducts(search: string): Promise<ProductWithVariants[]> {
  let query = supabase
    .from('products')
    .select('id, name, price, pack_units, variants:product_variants(id, size, color, discount, stock)')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as ProductWithVariants[];
}

async function createCustomer(input: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}): Promise<InPersonCustomer> {
  const { data, error } = await supabase
    .from('in_person_customers')
    .insert({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createSale(input: {
  customerId: string | null;
  items: SaleItem[];
  discount: number;
  amountPaid: number;
  balanceUsed: number;
  paymentMethod: string;
  notes?: string;
}): Promise<InPersonSale> {
  // Calculate total from items
  const total = input.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Create sale
  const { data: sale, error: saleError } = await supabase
    .from('in_person_sales')
    .insert({
      customer_id: input.customerId,
      total,
      discount: input.discount,
      amount_paid: input.amountPaid,
      balance_used: input.balanceUsed,
      payment_method: input.paymentMethod,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // Create sale items
  const saleItems = input.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount: item.discount,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from('in_person_sale_items')
    .insert(saleItems);

  if (itemsError) throw itemsError;

  return sale;
}

// ---------------------------------------------------------------------------
// Create Customer Dialog
// ---------------------------------------------------------------------------

function CreateCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (customer: InPersonCustomer) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const customer = await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success('Cliente creado correctamente');
      onSuccess(customer);
      onOpenChange(false);
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    } catch (error: any) {
      toast.error(`Error al crear cliente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente presencial</DialogTitle>
          <DialogDescription>
            Agregá un nuevo cliente para ventas presenciales.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Variant Picker Dialog
// ---------------------------------------------------------------------------

function VariantPickerDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  itemsInSale = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithVariants | null;
  onConfirm: (product: ProductWithVariants, variant: ProductWithVariants['variants'][0]) => void;
  itemsInSale?: SaleItem[];
}) {
  if (!product) return null;

  // Calculate available stock for each variant considering items already in sale
  const getAvailableStock = (variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return 0;
    const alreadyInSale = itemsInSale
      .filter(item => item.variantId === variantId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return variant.stock - alreadyInSale;
  };

  const availableVariants = product.variants.filter(v => getAvailableStock(v.id) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Elegí variante para <span className="font-normal">{product.name}</span></DialogTitle>
          <DialogDescription>
            Seleccioná talle y color disponibles.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {availableVariants.map((variant) => {
            const availableStock = getAvailableStock(variant.id);
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onConfirm(product, variant)}
                className="w-full p-3 border rounded-md text-left hover:bg-[#F0F0EC] transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">
                    {variant.size || 'Único'} {variant.color ? '· ' + variant.color : ''}
                  </div>
                  <div className="text-sm text-[#1A1A1A]/60">
                    Stock disponible: {availableStock} {variant.discount > 0 ? ' · ' + variant.discount + '% desc.' : ''}
                  </div>
                </div>
                <span className="font-medium">
                  {formatCurrency(product.price * (1 - (variant.discount || 0) / 100))}
                </span>
              </button>
            );
          })}
          {availableVariants.length === 0 && (
            <p className="text-center text-[#E8836B] py-4">
              Sin stock disponible en ninguna variante
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Pack Variant Picker Dialog (design 5.4 — in-person pack support)
// ---------------------------------------------------------------------------

function PackVariantPickerDialog({
  open,
  onOpenChange,
  product,
  onConfirmPack,
  itemsInSale = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithVariants | null;
  onConfirmPack: (
    product: ProductWithVariants,
    packItems: Array<{
      variant: ProductWithVariants['variants'][0];
      unitPrice: number;
      subtotal: number;
    }>,
  ) => void;
  itemsInSale?: SaleItem[];
}) {
  const packUnits = product?.pack_units ?? 0;
  const [slots, setSlots] = useState<Array<{ variantId: string | null }>>(
    () => Array.from({ length: packUnits || 2 }, () => ({ variantId: null })),
  );

  // Re-initialize slots when packUnits changes (e.g. different product)
  useEffect(() => {
    if (packUnits >= 2) {
      setSlots(Array.from({ length: packUnits }, () => ({ variantId: null })));
    }
  }, [packUnits]);

  if (!product || !product.pack_units || product.pack_units < 2) return null;

  // Available variants with stock (considering items already in sale)
  const getAvailableStock = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return 0;
    const alreadyInSale = itemsInSale
      .filter((item) => item.variantId === variantId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return variant.stock - alreadyInSale;
  };

  // Repeat-aware pick counts across slots
  const pickedCounts = new Map<string, number>();
  for (const slot of slots) {
    if (slot.variantId) {
      pickedCounts.set(slot.variantId, (pickedCounts.get(slot.variantId) ?? 0) + 1);
    }
  }

  const allSlotsFilled = slots.every((s) => s.variantId !== null);
  const allSlotsValid = slots.every((s) => {
    if (!s.variantId) return false;
    const stock = getAvailableStock(s.variantId);
    const demand = pickedCounts.get(s.variantId) ?? 0;
    return stock >= demand;
  });

  const handleConfirm = () => {
    if (!allSlotsFilled || !allSlotsValid) return;

    const packItems = slots.map((slot, idx) => {
      const variant = product.variants.find((v) => v.id === slot.variantId)!;
      const sp = splitPackPrice({
        total: product.price,
        packUnits,
        quantity: 1,
        rowIndex: idx + 1,
        rowCount: packUnits,
      });
      return {
        variant,
        unitPrice: sp.unitPrice,
        subtotal: sp.subtotal,
      };
    });

    onConfirmPack(product, packItems);
    setSlots(Array.from({ length: packUnits }, () => ({ variantId: null })));
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSlots(Array.from({ length: packUnits }, () => ({ variantId: null })));
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Pack x{packUnits} —{' '}
            <span className="font-normal">{product.name}</span>
          </DialogTitle>
          <DialogDescription>
            Elegí {packUnits} variantes. Repeticiones permitidas si hay stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#1A1A1A]">
            Precio total del pack: {formatCurrency(product.price)}
          </p>

          {slots.map((slot, slotIdx) => {
            const selectedVariant = slot.variantId
              ? product.variants.find((v) => v.id === slot.variantId)
              : null;
            const isValid =
              selectedVariant &&
              getAvailableStock(selectedVariant.id) >=
                (pickedCounts.get(selectedVariant.id) ?? 0);

            return (
              <div
                key={slotIdx}
                className="border rounded-md p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1A1A1A]/60 uppercase">
                    Unidad {slotIdx + 1} / {packUnits}
                  </span>
                  {selectedVariant && isValid && (
                    <span className="text-xs font-medium text-[#E8836B]">
                      {formatCurrency(
                        splitPackPrice({
                          total: product.price,
                          packUnits,
                          rowIndex: slotIdx + 1,
                          rowCount: packUnits,
                        }).unitPrice,
                      )}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((variant) => {
                    const stock = getAvailableStock(variant.id);
                    const demand = pickedCounts.get(variant.id) ?? 0;
                    const isExhausted = stock - demand <= 0;
                    const label = `${variant.size || 'Único'}${variant.color ? ' · ' + variant.color : ''}`;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={isExhausted}
                        onClick={() => {
                          const newSlots = [...slots];
                          newSlots[slotIdx] = { variantId: variant.id };
                          setSlots(newSlots);
                        }}
                        className={cn(
                          'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                          slot.variantId === variant.id
                            ? 'border-[#E8836B] bg-[#E8836B] text-white'
                            : isExhausted
                              ? 'cursor-not-allowed border-[#E2E2DC] bg-[#F0F0EC] text-[#1A1A1A]/30'
                              : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]',
                        )}
                      >
                        {label}
                        {variant.discount > 0 && (
                          <span className="ml-1 text-[10px] opacity-70">
                            -{variant.discount}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {slot.variantId && !isValid && (
                  <p className="text-xs text-red-500">
                    Sin stock para esta variante
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!allSlotsFilled || !allSlotsValid}
            onClick={handleConfirm}
          >
            Confirmar pack
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Collect Payment Dialog
// ---------------------------------------------------------------------------

function CollectPaymentDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: InPersonCustomer | null;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const collectMutation = useMutation({
    mutationFn: async ({
      customerId,
      amount,
      paymentMethod,
      notes,
    }: {
      customerId: string;
      amount: number;
      paymentMethod: string;
      notes?: string;
    }) => {
      // Update customer balance (reduce debt)
      const newBalance = customer!.balance - amount;
      const { error: customerError } = await supabase
        .from('in_person_customers')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', customerId);

      if (customerError) throw customerError;

      // Create cash movement
      const { error: cashError } = await supabase
        .from('cash_movements')
        .insert({
          type: 'income',
          amount,
          reference_type: 'debt_collection',
          reference_id: customerId,
          description: `Cobro deuda - ${customer!.name}${notes ? ': ' + notes : ''}`,
          created_at: new Date().toISOString(),
        });

      if (cashError) throw cashError;
    },
    onSuccess: () => {
      toast.success('Pago registrado correctamente');
      onSuccess();
      onOpenChange(false);
      setAmount(0);
      setNotes('');
      setPaymentMethod('efectivo');
    },
    onError: (error: any) => {
      toast.error(`Error al registrar pago: ${error.message}`);
    },
  });

  if (!customer) return null;

  const maxAmount = customer.balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar deuda a <span className="font-normal">{customer.name}</span></DialogTitle>
          <DialogDescription>
            Deuda actual: <strong>{formatCurrency(customer.balance)}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); collectMutation.mutate({ customerId: customer.id, amount, paymentMethod, notes: notes.trim() || undefined }); }} className="space-y-4">
          <div>
            <Label htmlFor="amount">Monto a cobrar *</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              max={customer.balance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
            <p className="text-sm text-[#1A1A1A]/60 mt-1">
              Deuda actual: {formatCurrency(customer.balance)}
            </p>
          </div>
          <div>
            <Label>Método de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referencia, observaciones..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || amount <= 0 || amount > customer.balance}>
              {loading ? 'Registrando...' : `Cobrar ${formatCurrency(amount)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Customer Movements Dialog
// ---------------------------------------------------------------------------

function CustomerMovementsDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: InPersonCustomer | null;
}) {
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['admin', 'customer-sales', customer?.id],
    queryFn: () => customer ? fetchCustomerSales(customer.id) : Promise.resolve([]),
    enabled: open && !!customer,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin', 'customer-payments', customer?.id],
    queryFn: () => customer ? fetchCustomerPayments(customer.id) : Promise.resolve([]),
    enabled: open && !!customer,
  });

  const isLoading = salesLoading || paymentsLoading;

  // Combine sales and payments into a single timeline sorted by date
  const allMovements = [
    ...(sales ?? []).map(s => ({ ...s, type: 'sale' as const })),
    ...(payments ?? []).map(p => ({ ...p, type: 'payment' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Movimientos de {customer.name}</DialogTitle>
          <DialogDescription>
            Historial de ventas y cobros de deuda
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Balance summary */}
          <div className="p-3 md:p-4 bg-[#F0F0EC] rounded-md">
            <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4 md:gap-4">
              <div>
                <p className="text-xs text-[#1A1A1A]/60 md:text-sm">Deuda actual</p>
                <p className="font-bold text-base text-[#E8836B] md:text-lg">
                  {customer.balance > 0 ? formatCurrency(customer.balance) : '$0.00'}
                </p>
                {customer.balance < 0 && (
                  <p className="text-xs text-green-600 font-bold md:text-sm">
                    A favor: {formatCurrency(Math.abs(customer.balance))}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#1A1A1A]/60 md:text-sm">Total compras</p>
                <p className="font-bold text-base md:text-lg">
                  {formatCurrency(sales?.reduce((sum, s) => sum + s.total, 0) ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#1A1A1A]/60 md:text-sm">Pagos en ventas</p>
                <p className="font-bold text-base text-green-600 md:text-lg">
                  {formatCurrency(sales?.reduce((sum, s) => sum + s.amount_paid + s.balance_used, 0) ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#1A1A1A]/60 md:text-sm">Cobros de deuda</p>
                <p className="font-bold text-base text-blue-600 md:text-lg">
                  {formatCurrency(payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Movements timeline */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 md:h-20 w-full" />
              ))}
            </div>
          )}

          {!isLoading && allMovements.length === 0 && (
            <p className="text-center text-[#1A1A1A]/50 py-8">
              No hay movimientos registrados para este cliente.
            </p>
          )}

          {allMovements.map((movement) => (
            <div key={movement.id} className="border rounded-md overflow-hidden">
              <div className="bg-[#F0F0EC] px-3 py-2 md:px-4 md:py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium md:text-base">{formatDate(movement.created_at)}</p>
                  <p className="text-xs text-[#1A1A1A]/60 md:text-sm">
                    {movement.type === 'sale'
                      ? `${movement.payment_method} · ${formatCurrency(movement.amount_paid)} pagado`
                      : `Cobro deuda · ${movement.payment_method}`}
                    {movement.type === 'sale' && movement.balance_used > 0 && (
                      <> · {' '} <span className="text-green-600">{formatCurrency(movement.balance_used)} crédito</span></>
                    )}
                    {movement.type === 'payment' && movement.description && (
                      <> · {' '} <span className="text-[#1A1A1A]/60">{movement.description}</span></>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {movement.type === 'sale' ? (
                    <>
                      <p className="font-bold text-sm text-[#E8836B] md:text-base">{formatCurrency(movement.total)}</p>
                      {movement.discount > 0 && <p className="text-xs text-[#E8836B] md:text-sm">{movement.discount}% desc.</p>}
                    </>
                  ) : (
                    <p className="font-bold text-sm text-blue-600 md:text-base">+{formatCurrency(movement.amount)}</p>
                  )}
                </div>
              </div>
              {movement.type === 'sale' && movement.items && (
                <div className="p-3 space-y-2 md:p-4">
                  {movement.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs md:text-sm">
                      <span className="flex-1">
                        {item.quantity}x {item.product_name} ({item.variant_label})
                      </span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              {movement.type === 'payment' && movement.description && (
                <div className="px-3 pb-3 text-xs text-[#1A1A1A]/60 md:px-4 md:pb-4 md:text-sm">
                  Referencia: {movement.description}
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Customer Info Dialog
// ---------------------------------------------------------------------------

function CustomerInfoDialog({
  open,
  onOpenChange,
  customer,
  onCollectPayment,
  onViewMovements,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: InPersonCustomer | null;
  onCollectPayment: (customer: InPersonCustomer) => void;
  onViewMovements: (customer: InPersonCustomer) => void;
}) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
          <DialogDescription>
            Información del cliente presencial
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#1A1A1A]/60">Teléfono</p>
              <p className="font-medium">{customer.phone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-[#1A1A1A]/60">Email</p>
              <p className="font-medium break-all">{customer.email || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-[#1A1A1A]/60">Dirección</p>
            <p className="font-medium">{customer.address || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#1A1A1A]/60">Saldo</p>
            {customer.balance > 0 ? (
              <Badge variant="destructive">
                Deuda: {formatCurrency(customer.balance)}
              </Badge>
            ) : customer.balance < 0 ? (
              <Badge variant="success">
                A favor: {formatCurrency(Math.abs(customer.balance))}
              </Badge>
            ) : (
              <Badge variant="secondary">$0.00</Badge>
            )}
          </div>
          <div>
            <p className="text-sm text-[#1A1A1A]/60">Cliente desde</p>
            <p className="font-medium">{formatDate(customer.created_at)}</p>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onViewMovements(customer)}>
            Movimientos
          </Button>
          {customer.balance > 0 && (
            <Button onClick={() => onCollectPayment(customer)}>
              Cobrar deuda
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Create Sale Dialog
// ---------------------------------------------------------------------------

function CreateSaleDialog({
  open,
  onOpenChange,
  customers,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: InPersonCustomer[];
  onSuccess: () => void;
}) {
  const [customerId, setCustomerId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [balanceUsed, setBalanceUsed] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectingVariants, setSelectingVariants] = useState<ProductWithVariants | null>(null);
  const [selectingPackVariants, setSelectingPackVariants] = useState<ProductWithVariants | null>(null);
  const [forceClose, setForceClose] = useState(false);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin', 'products', 'search', productSearch],
    queryFn: () => fetchProducts(productSearch),
    enabled: open && productSearch.length >= 2,
  });

  const handleForceClose = () => {
    setForceClose(true);
    onOpenChange(false);
    setForceClose(false);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const finalTotal = total * (1 - discount / 100);
  const remaining = finalTotal - amountPaid - balanceUsed;
  // Projected balance BEFORE any payment in this transaction
  const projectedBalanceBeforePayment = (selectedCustomer?.balance ?? 0) + finalTotal;
  // Projected balance AFTER payment
  const projectedBalanceAfterPayment = (selectedCustomer?.balance ?? 0) + remaining;

  const handleAddProduct = (product: ProductWithVariants) => {
    // Pack products: open the N-slot pack picker
    if (product.pack_units != null && product.pack_units >= 2) {
      setSelectingPackVariants(product);
      setProductSearch('');
      return;
    }
    // If product has variants, open single variant picker
    if (product.variants.length > 0) {
      setSelectingVariants(product);
      setProductSearch('');
      return;
    }
    // No variants, add directly
    const variantLabel = 'Sin variante';
    const price = product.price;

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        variantId: null,
        variantLabel,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        subtotal: price,
      },
    ]);
    setProductSearch('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity, subtotal: item.unitPrice * quantity * (1 - item.discount / 100) }
          : item
      )
    );
  };

  const handleUpdateItemDiscount = (index: number, itemDiscount: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              discount: itemDiscount,
              subtotal: item.unitPrice * item.quantity * (1 - itemDiscount / 100),
            }
          : item
      )
    );
  };

  const handleUseBalance = () => {
    if (selectedCustomer && selectedCustomer.balance < 0) {
      // Only use credit (negative balance), not debt
      const maxCredit = Math.min(Math.abs(selectedCustomer.balance), finalTotal);
      setBalanceUsed(maxCredit);
    }
  };

  const handleConfirmVariant = (product: ProductWithVariants, variant: ProductWithVariants['variants'][0]) => {
    const variantLabel = variant
      ? `${variant.size || ''} ${variant.color || ''}`.trim() || 'Sin variante'
      : 'Sin variante';
    const price = variant ? product.price * (1 - (variant.discount || 0) / 100) : product.price;

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        variantId: variant?.id || null,
        variantLabel,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        subtotal: price,
      },
    ]);
    setSelectingVariants(null);
  };

  const handleConfirmPack = (
    product: ProductWithVariants,
    packItems: Array<{
      variant: ProductWithVariants['variants'][0];
      unitPrice: number;
      subtotal: number;
    }>,
  ) => {
    const newItems: SaleItem[] = packItems.map((pi) => ({
      productId: product.id,
      productName: product.name,
      variantId: pi.variant.id,
      variantLabel: `${pi.variant.size || ''} ${pi.variant.color || ''}`.trim() || 'Sin variante',
      quantity: 1,
      unitPrice: pi.unitPrice,
      discount: 0,
      subtotal: pi.subtotal,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setSelectingPackVariants(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Agregá al menos un producto');
      return;
    }

    setLoading(true);
    try {
      await createSale({
        customerId: customerId || null,
        items,
        discount,
        amountPaid,
        balanceUsed,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      toast.success('Venta registrada correctamente');
      onSuccess();
      onOpenChange(false);
      // Reset form
      setCustomerId('');
      setItems([]);
      setDiscount(0);
      setAmountPaid(0);
      setBalanceUsed(0);
      setPaymentMethod('efectivo');
      setNotes('');
    } catch (error: any) {
      toast.error(`Error al registrar venta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && items.length > 0 && !forceClose) {
          // Prevent closing on overlay click if there are unsaved items
          // Only allow closing via explicit cancel/save buttons
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva venta presencial</DialogTitle>
          <DialogDescription>
            Registrá una nueva venta con productos y descuentos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer selection */}
          <div>
            <Label>Cliente (opcional)</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.balance > 0 && `(Deuda: ${formatCurrency(customer.balance)})`}
                    {customer.balance < 0 && `(Saldo a favor: ${formatCurrency(Math.abs(customer.balance))})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer && selectedCustomer.balance > 0 && (
              <p className="text-sm text-[#E8836B] mt-1">
                Deuda: {formatCurrency(selectedCustomer.balance)}
              </p>
            )}
          </div>

          {/* Product search */}
          <div>
            <Label>Buscar producto</Label>
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Escribí al menos 2 caracteres..."
            />
            {loadingProducts && <Skeleton className="h-10 w-full mt-2" />}
            {products && products.length > 0 && (
              <div className="mt-2 border rounded-md divide-y max-h-40 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full px-3 py-2 text-left hover:bg-[#F0F0EC] transition-colors"
                  >
                    <div className="font-medium">
                      {product.name}
                      {product.pack_units != null && product.pack_units >= 2 && (
                        <Badge variant="default" className="ml-2 bg-[#1A1A1A] text-[10px] text-white">
                          Pack x{product.pack_units}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-[#1A1A1A]/60">
                      {product.pack_units != null && product.pack_units >= 2
                        ? `Precio pack: ${formatCurrency(product.price)}`
                        : formatCurrency(product.price)}
                      {product.variants.length > 0 && ` · ${product.variants.length} variantes`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableBody>
                  {items.map((item, index) => (
                    <>
                      {/* Row 1: Product name header + value */}
                      <TableRow key={`name-${index}`} className="bg-[#F0F0EC]">
                        <TableCell className="font-medium text-sm text-[#1A1A1A]/70 py-2 px-3 w-[20%]">
                          Nombre
                        </TableCell>
                        <TableCell colSpan={5} className="font-medium py-2 px-3">
                          <div>
                            <span className="text-[#1A1A1A]">{item.productName}</span>
                            <span className="ml-2 text-sm text-[#1A1A1A]/60">{item.variantLabel}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Row 2: Sub-headers for controls */}
                      <TableRow key={`subheader-${index}`} className="bg-[#FAFAF8]">
                        <TableCell className="hidden"></TableCell>
                        <TableCell className="font-medium text-xs text-[#1A1A1A]/60 uppercase tracking-wide py-1 px-2">
                          Cant.
                        </TableCell>
                        <TableCell className="font-medium text-xs text-[#1A1A1A]/60 uppercase tracking-wide py-1 px-2">
                          Prec.Uni
                        </TableCell>
                        <TableCell className="font-medium text-xs text-[#1A1A1A]/60 uppercase tracking-wide py-1 px-2">
                          Desc.%
                        </TableCell>
                        <TableCell className="font-medium text-xs text-[#1A1A1A]/60 uppercase tracking-wide py-1 px-2">
                          SubTotal
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {/* Row 3: Actual controls */}
                      <TableRow key={`controls-${index}`} className="bg-white">
                        <TableCell className="hidden"></TableCell>
                        <TableCell className="py-1 px-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-full max-w-[70px] text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-[#1A1A1A]/70 text-sm py-1 px-2">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleUpdateItemDiscount(index, parseInt(e.target.value) || 0)}
                            className="w-full max-w-[60px] text-sm"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-[#1A1A1A] text-sm py-1 px-2">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Separator */}
                      {index < items.length - 1 && (
                        <TableRow key={`sep-${index}`}>
                          <TableCell colSpan={6} className="border-t border-[#E2E2DC] py-0" />
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2 bg-[#F0F0EC] p-4 rounded-md">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Descuento general:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-[#1A1A1A]/60">%</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            {selectedCustomer && selectedCustomer.balance < 0 && (
              <div className="flex justify-between items-center">
                <span>Usar crédito:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={Math.min(Math.abs(selectedCustomer.balance), finalTotal)}
                    value={balanceUsed}
                    onChange={(e) => setBalanceUsed(parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleUseBalance}>
                    Usar todo el crédito
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Monto pagado:</span>
              <Input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
            {projectedBalanceBeforePayment > 0 && (
              <div className="flex justify-between text-[#1A1A1A] font-medium">
                <span>Deuda total si no paga nada:</span>
                <span>{formatCurrency(projectedBalanceBeforePayment)}</span>
              </div>
            )}
            {remaining > 0 && (
              <div className="flex justify-between text-[#E8836B] font-medium">
                <span>Queda debiendo en esta venta:</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
            )}
            {projectedBalanceAfterPayment > 0 && (
              <div className="flex justify-between text-[#E8836B] font-bold text-lg">
                <span>Deuda total después de la venta:</span>
                <span>{formatCurrency(projectedBalanceAfterPayment)}</span>
              </div>
            )}
            {remaining < 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Cambio:</span>
                <span>{formatCurrency(Math.abs(remaining))}</span>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <Label>Método de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label>Notas</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? 'Registrando...' : 'Registrar venta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <VariantPickerDialog
        open={!!selectingVariants}
        onOpenChange={(open) => { if (!open) setSelectingVariants(null); }}
        product={selectingVariants}
        onConfirm={handleConfirmVariant}
        itemsInSale={items}
      />
      <PackVariantPickerDialog
        open={!!selectingPackVariants}
        onOpenChange={(open) => { if (!open) setSelectingPackVariants(null); }}
        product={selectingPackVariants}
        onConfirmPack={handleConfirmPack}
        itemsInSale={items}
      />
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function InPersonSalesPage() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createSaleOpen, setCreateSaleOpen] = useState(false);
  const [movementsCustomer, setMovementsCustomer] = useState<InPersonCustomer | null>(null);
  const [collectPaymentCustomer, setCollectPaymentCustomer] = useState<InPersonCustomer | null>(null);
  const [infoCustomer, setInfoCustomer] = useState<InPersonCustomer | null>(null);

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin', 'in-person-customers', customerSearch],
    queryFn: () => fetchCustomers(customerSearch),
  });

  const handleCustomerCreated = (customer: InPersonCustomer) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'in-person-customers'] });
  };

  const handleSaleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'in-person-customers'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'cash-movements'] });
  };

  const openMovements = (customer: InPersonCustomer) => {
    setMovementsCustomer(customer);
  };

  const openCollectPayment = (customer: InPersonCustomer) => {
    setCollectPaymentCustomer(customer);
  };

  const openInfo = (customer: InPersonCustomer) => {
    setInfoCustomer(customer);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Ventas presencial</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateCustomerOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
          <Button onClick={() => setCreateSaleOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Nueva venta
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/40" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customers table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Dirección</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="hidden md:table-cell">Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && customers && customers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-[#1A1A1A]/50"
                >
                  {customerSearch
                    ? 'No se encontraron clientes con ese nombre o teléfono.'
                    : 'No hay clientes presenciales todavía. ¡Creá el primero!'}
                </TableCell>
              </TableRow>
            )}

            {customers?.map((customer) => (
              <TableRow
                key={customer.id}
                onClick={() => openMovements(customer)}
                className="cursor-pointer hover:bg-[#F0F0EC]"
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="hidden text-[#1A1A1A]/60 md:table-cell">
                  {customer.phone || '—'}
                </TableCell>
                <TableCell className="hidden text-[#1A1A1A]/60 md:table-cell">
                  {customer.email || '—'}
                </TableCell>
                <TableCell className="hidden text-[#1A1A1A]/60 md:table-cell">
                  {customer.address || '—'}
                </TableCell>
                <TableCell>
                  {customer.balance > 0 ? (
                    <Badge variant="destructive">
                      Deuda: {formatCurrency(customer.balance)}
                    </Badge>
                  ) : customer.balance < 0 ? (
                    <Badge variant="success">
                      A favor: {formatCurrency(Math.abs(customer.balance))}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">$0.00</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(customer.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {customer.balance > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCollectPayment(customer);
                        }}
                        className="text-green-600 hover:bg-green-50"
                        aria-label={`Cobrar deuda de ${customer.name}`}
                      >
                        <HandCoins className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Cobrar</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInfo(customer);
                      }}
                      aria-label={`Ver información de ${customer.name}`}
                    >
                      <Eye className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Info</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateCustomerDialog
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onSuccess={handleCustomerCreated}
      />

      <CreateSaleDialog
        open={createSaleOpen}
        onOpenChange={setCreateSaleOpen}
        customers={customers ?? []}
        onSuccess={handleSaleCreated}
      />

      <CustomerMovementsDialog
        open={!!movementsCustomer}
        onOpenChange={(open) => { if (!open) setMovementsCustomer(null); }}
        customer={movementsCustomer}
      />

      <CollectPaymentDialog
        open={!!collectPaymentCustomer}
        onOpenChange={(open) => { if (!open) setCollectPaymentCustomer(null); }}
        customer={collectPaymentCustomer}
        onSuccess={handleSaleCreated}
      />

      <CustomerInfoDialog
        open={!!infoCustomer}
        onOpenChange={(open) => { if (!open) setInfoCustomer(null); }}
        customer={infoCustomer}
        onCollectPayment={(customer) => {
          setInfoCustomer(null);
          openCollectPayment(customer);
        }}
        onViewMovements={(customer) => {
          setInfoCustomer(null);
          openMovements(customer);
        }}
      />
    </div>
  );
}
