/**
 * CartPackGroup — Renders a set of cart rows for a single pack product,
 * grouped under a "Pack xN" badge with per-row split prices.
 *
 * The pack total (= products.price) is displayed as the group total.
 * Split pricing is computed via splitPackPrice from @mbt/shared so the
 * display matches the authoritative create_order_from_cart RPC math.
 */
import type { CartItem } from '@mbt/shared';
import { formatPrice, splitPackPrice } from '@mbt/shared';
import { CartItemRow } from './cart-item-row';

interface CartPackGroupProps {
  /** All cart items belonging to the same pack product (same product_id) */
  items: CartItem[];
  /** Pack size (products.pack_units) */
  packUnits: number;
  /** Compact vs full layout */
  variant?: 'compact' | 'full';
  onIncrement: (itemId: string, currentQty: number) => void;
  onDecrement: (itemId: string, currentQty: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
}

/**
 * Sort comparator: ASC by created_at, then by id — matches the RPC's
 * ROW_NUMBER/COUNT OVER (product_id) ORDER BY created_at, id so that the
 * remainder lands on the same row in display as at checkout.
 */
function byCreatedAtAsc(a: CartItem, b: CartItem): number {
  const t = a.created_at.localeCompare(b.created_at);
  return t !== 0 ? t : a.id.localeCompare(b.id);
}

export function CartPackGroup({
  items,
  packUnits,
  variant = 'compact',
  onIncrement,
  onDecrement,
  onRemove,
  isUpdating,
}: CartPackGroupProps) {
  // Sort ASC to match RPC remainder ordering
  const sorted = [...items].sort(byCreatedAtAsc);
  const rowCount = sorted.length;

  // Compute group total (should equal products.price exactly)
  const productPrice = sorted[0]?.product_price ?? 0;

  return (
    <div className="border-b border-[#E2E2DC] py-4">
      {/* Group header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="inline-block rounded bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Pack x{packUnits}
        </span>
        <span className="text-xs text-[#1A1A1A]/50">
          {sorted[0]?.product_name}
        </span>
      </div>

      {/* Pack rows with split pricing */}
      <div>
        {sorted.map((item, idx) => {
          const sp = splitPackPrice({
            total: productPrice,
            packUnits,
            quantity: item.quantity,
            rowIndex: idx + 1,
            rowCount,
          });

          return (
            <CartItemRow
              key={item.id}
              item={item}
              variant={variant}
              displayUnitPrice={sp.unitPrice}
              lineTotal={sp.subtotal}
              onIncrement={() => onIncrement(item.id, item.quantity)}
              onDecrement={() => onDecrement(item.id, item.quantity)}
              onRemove={() => onRemove(item.id)}
              isUpdating={isUpdating}
            />
          );
        })}
      </div>

      {/* Group total */}
      <div className="mt-1 flex items-center justify-between px-1">
        <span className="text-xs font-medium text-[#1A1A1A]/50">
          Total pack
        </span>
        <span className="text-sm font-bold text-[#1A1A1A]">
          {formatPrice(productPrice)}
        </span>
      </div>
    </div>
  );
}
