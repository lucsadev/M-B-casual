/**
 * CartSidebar — Slide-over sidebar panel for the cart.
 *
 * Accessible from any page via the cart icon in the header.
 * Shows cart items with quantity controls, totals summary,
 * and navigation to the full cart page or checkout.
 *
 * Implemented as a fixed overlay panel that slides in from the right.
 * Uses CSS transitions for the slide animation.
 */
import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { useUpdateQty, useRemoveItem } from '../hooks/use-cart';
import { CartItemRow } from './cart-item-row';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@mbt/shared';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { items, summary, isLoading } = useCartContext();
  const { mutate: updateQty, isPending: isUpdating } = useUpdateQty();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveItem();

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

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

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#FFFFFF] shadow-xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E2DC] px-4 py-3">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            Carrito
            {items.length > 0 && (
              <span className="ml-1 text-sm font-normal text-[#1A1A1A]/50">
                ({summary.item_count} {summary.item_count === 1 ? 'producto' : 'productos'})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
            aria-label="Cerrar carrito"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8836B] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 h-12 w-12 text-[#1A1A1A]/20"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <p className="mb-2 text-sm font-medium text-[#1A1A1A]">
                Tu carrito está vacío
              </p>
              <p className="mb-6 text-xs text-[#1A1A1A]/50">
                Explorá nuestro catálogo y encontrá lo que buscás.
              </p>
              <Link
                to="/catalogo"
                onClick={onClose}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#E8836B] px-4 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            /* Items list */
            <div className="divide-y divide-[#E2E2DC]">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  variant="compact"
                  onIncrement={() => handleIncrement(item.id, item.quantity)}
                  onDecrement={() => handleDecrement(item.id, item.quantity)}
                  onRemove={() => removeItem(item.id)}
                  isUpdating={isUpdating || isRemoving}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="border-t border-[#E2E2DC] bg-[#FFFFFF] px-4 py-4">
            {/* Totals */}
            <div className="mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-[#1A1A1A]/60">
                <span>Subtotal</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#1A1A1A]/60">
                <span>Envío</span>
                <span>
                  {summary.shipping_cost === 0
                    ? 'Gratis'
                    : formatPrice(summary.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1A1A1A]">
                <span>Total</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link
                to="/carrito"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#E8836B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
              >
                Ir al checkout
              </Link>
              <Link
                to="/carrito"
                onClick={onClose}
                className="text-center text-xs text-[#1A1A1A]/50 underline underline-offset-2 hover:text-[#E8836B] transition-colors"
              >
                Ver carrito completo
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
