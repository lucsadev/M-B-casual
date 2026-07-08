/**
 * CartPage — Full-width cart page at /carrito.
 *
 * Shows:
 * - Complete list of cart items with quantity controls and line totals
 * - Subtotal per item, shipping, and order total
 * - "Iniciar checkout" button
 * - Empty state with link to catalog
 */
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { useUpdateQty, useRemoveItem } from '../hooks/use-cart';
import { CartItemRow } from '../components/cart-item-row';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@mbt/shared';
import { cn } from '@/lib/utils';

export function CartPage() {
  const { items, summary, isLoading } = useCartContext();
  const { mutate: updateQty, isPending: isUpdating } = useUpdateQty();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveItem();

  const handleIncrement = useCallback(
    (itemId: string, currentQty: number) => {
      updateQty({ itemId, quantity: currentQty + 1 });
    },
    [updateQty],
  );

  const handleDecrement = useCallback(
    (itemId: string, currentQty: number) => {
      if (currentQty > 1) {
        updateQty({ itemId, quantity: currentQty - 1 });
      }
    },
    [updateQty],
  );

  // Loading state
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </section>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-6 h-16 w-16 text-[#1A1A1A]/20"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        <h1 className="mb-3 text-2xl font-bold text-[#1A1A1A]">
          Tu carrito está vacío
        </h1>
        <p className="mb-8 text-[#1A1A1A]/60">
          Explorá nuestro catálogo y agregá productos que te gusten.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#D4A853] px-6 text-sm font-medium text-white transition-colors hover:bg-[#D4A853]/90"
        >
          Explorar catálogo
        </Link>
      </section>
    );
  }

  const busy = isUpdating || isRemoving;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Carrito</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          {summary.item_count} {summary.item_count === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items list */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-[#E8E4D9] bg-white">
            {/* Table header — visible on md+ */}
            <div className={cn(
              'hidden border-b border-[#E8E4D9] px-4 py-3 md:grid md:grid-cols-12',
              'text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50',
            )}>
              <div className="col-span-6">Producto</div>
              <div className="col-span-2 text-center">Precio</div>
              <div className="col-span-2 text-center">Cantidad</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            <div className="divide-y divide-[#E8E4D9] px-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  variant="full"
                  onIncrement={() => handleIncrement(item.id, item.quantity)}
                  onDecrement={() => handleDecrement(item.id, item.quantity)}
                  onRemove={() => removeItem(item.id)}
                  isUpdating={busy}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-lg border border-[#E8E4D9] bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">
              Resumen
            </h2>

            <div className="space-y-3 text-sm">
              {/* Items count */}
              <div className="flex justify-between text-[#1A1A1A]/60">
                <span>Productos ({summary.item_count})</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-[#1A1A1A]/60">
                <span>Envío</span>
                <span>
                  {summary.shipping_cost === 0
                    ? 'Gratis'
                    : formatPrice(summary.shipping_cost)}
                </span>
              </div>

              {/* Discount (if any) */}
              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(summary.discount)}</span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-[#E8E4D9]" />

              {/* Total */}
              <div className="flex justify-between text-base font-bold text-[#1A1A1A]">
                <span>Total</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#D4A853] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#D4A853]/90"
            >
              Iniciar checkout
            </Link>

            <p className="mt-3 text-center text-xs text-[#1A1A1A]/40">
              Impuestos incluidos. Envío calculado al finalizar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
