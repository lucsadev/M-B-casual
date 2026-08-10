/**
 * InPersonSalesPage — Admin page for in-person sales management.
 *
 * Features:
 * - Customer list with search and balance display
 * - Create new customers
 * - Create new sales with products, discounts, and payment tracking
 * - Balance tracking for partial payments
 */
import { useState } from 'react';
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
import { Plus, Search, ShoppingCart, UserPlus, Edit, X } from 'lucide-react';
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

// Product with variants for sale builder
interface ProductWithVariants {
  id: string;
  name: string;
  price: number;
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
    .select('id, name, price, variants:product_variants(id, size, color, discount, stock)')
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

  const handleAddProduct = (product: ProductWithVariants) => {
    // If product has variants, open variant picker
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
    if (selectedCustomer && selectedCustomer.balance > 0) {
      const maxBalance = Math.min(selectedCustomer.balance, finalTotal);
      setBalanceUsed(maxBalance);
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
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-[#1A1A1A]/60">
                      {formatCurrency(product.price)}
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
            {selectedCustomer && selectedCustomer.balance > 0 && (
              <div className="flex justify-between items-center">
                <span>Usar deuda:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={Math.min(selectedCustomer.balance, finalTotal)}
                    value={balanceUsed}
                    onChange={(e) => setBalanceUsed(parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleUseBalance}>
                    Usar toda la deuda
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
            {remaining > 0 && (
              <div className="flex justify-between text-[#E8836B] font-medium">
                <span>Queda debiendo:</span>
                <span>{formatCurrency(remaining)}</span>
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
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Creado</TableHead>
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

            {!isLoading && customers && customers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-[#1A1A1A]/50"
                >
                  {customerSearch
                    ? 'No se encontraron clientes con ese nombre o teléfono.'
                    : 'No hay clientes presenciales todavía. ¡Creá el primero!'}
                </TableCell>
              </TableRow>
            )}

            {customers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {customer.phone || '—'}
                </TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {customer.email || '—'}
                </TableCell>
                <TableCell className="text-[#1A1A1A]/60">
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
                <TableCell>{formatDate(customer.created_at)}</TableCell>
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
    </div>
  );
}
