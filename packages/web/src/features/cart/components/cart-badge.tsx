/**
 * CartBadge — Header cart icon with item count badge.
 *
 * Reads item count from CartContext. Changes are reactive because
 * the context reads from the TanStack Query cache.
 *
 * Renders a shopping cart SVG icon with a numbered badge overlay.
 * Shows "0" when cart is empty.
 */
import { useCartContext } from '../context/CartContext';
import { cn } from '@/lib/utils';

interface CartBadgeProps {
  /** Optional className to override positioning */
  className?: string;
  /** Click handler to open the sidebar */
  onOpenSidebar?: () => void;
}

export function CartBadge({ className, onOpenSidebar }: CartBadgeProps) {
  const { totalItems, isLoading } = useCartContext();

  return (
    <button
      onClick={onOpenSidebar}
      disabled={isLoading}
      className={cn(
        'relative inline-flex items-center justify-center',
        'text-[#1A1A1A] transition-colors hover:text-[#E8836B]',
        className,
      )}
      aria-label={`Carrito (${totalItems} productos)`}
    >
      {/* Shopping cart icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>

      {/* Badge count */}
      {totalItems > 0 && (
        <span
          className={cn(
            'absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center',
            'rounded-full bg-[#E8836B] px-1 text-[10px] font-bold text-white',
            'leading-none',
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
