/**
 * CartItemRow — Line item component for cart display.
 *
 * Renders a single cart item with:
 * - Thumbnail image
 * - Product name + variant info
 * - Quantity stepper (+ / -)
 * - Line total price
 * - Remove button
 *
 * Used in both CartSidebar (compact) and CartPage (full width).
 */
import type { CartItem } from '@mbt/shared';
import { formatPrice } from '@mbt/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartItemRowProps {
  item: CartItem;
  /** Compact mode (for sidebar) vs full mode (for cart page) */
  variant?: 'compact' | 'full';
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  isUpdating?: boolean;
}

export function CartItemRow({
  item,
  variant = 'compact',
  onIncrement,
  onDecrement,
  onRemove,
  isUpdating,
}: CartItemRowProps) {
  const lineTotal = item.unit_price * item.quantity;
  const imageUrl = item.product_image ?? '/placeholder-product.svg';

  return (
    <div
      className={cn(
        'flex gap-3 border-b border-[#E2E2DC] py-4',
        variant === 'full' && 'items-start',
        isUpdating && 'opacity-60',
      )}
    >
      {/* Thumbnail */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[#F0F0EC]">
        <img
          src={imageUrl}
          alt={item.product_name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1">
        {/* Name + variant */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2">
              {item.product_name}
            </h3>
            {item.variant_label && (
              <p className="text-xs text-[#1A1A1A]/50">{item.variant_label}</p>
            )}
          </div>

          {/* Price */}
          <span className="text-sm font-semibold text-[#1A1A1A] whitespace-nowrap">
            {formatPrice(lineTotal)}
          </span>
        </div>

        {/* Actions row: quantity stepper + remove */}
        <div className="mt-auto flex items-center justify-between">
          {/* Quantity stepper */}
          <div className="flex items-center gap-1 rounded-md border border-[#E2E2DC]">
            <button
              onClick={onDecrement}
              disabled={item.quantity <= 1 || isUpdating}
              className={cn(
                'flex h-7 w-7 items-center justify-center text-sm transition-colors',
                'hover:bg-[#F0F0EC] disabled:opacity-30',
              )}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="flex h-7 w-8 items-center justify-center text-xs font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              disabled={isUpdating}
              className={cn(
                'flex h-7 w-7 items-center justify-center text-sm transition-colors',
                'hover:bg-[#F0F0EC] disabled:opacity-30',
              )}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isUpdating}
            className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            {variant === 'full' && <span>Eliminar</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
