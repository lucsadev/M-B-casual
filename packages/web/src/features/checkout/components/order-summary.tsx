/**
 * OrderSummary — Read-only summary of cart items and totals for the checkout page.
 *
 * Shows:
 * - List of items with name, variant, quantity, and line total
 * - Subtotal, shipping, and grand total
 */
import type { CartItem, CartSummary } from '@mbt/shared';
import { formatPrice } from '@mbt/shared';

interface OrderSummaryProps {
  items: CartItem[];
  summary: CartSummary;
}

export function OrderSummary({ items, summary }: OrderSummaryProps) {
  return (
    <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">
        Resumen del pedido
      </h2>

      {/* Items list */}
      <div className="divide-y divide-[#E2E2DC]">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 py-3">
            {/* Thumbnail */}
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-[#F0F0EC]">
              <img
                src={item.product_image ?? '/placeholder-product.svg'}
                alt={item.product_name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">
                {item.product_name}
              </p>
              {item.variant_label && (
                <p className="text-xs text-[#1A1A1A]/50">
                  {item.variant_label}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#1A1A1A]/60">
                  x{item.quantity}
                </span>
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {formatPrice(item.unit_price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-2 border-t border-[#E2E2DC] pt-4 text-sm">
        <div className="flex justify-between text-[#1A1A1A]/60">
          <span>Subtotal ({summary.item_count} productos)</span>
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
        {summary.discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Descuento</span>
            <span>-{formatPrice(summary.discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#E2E2DC] pt-2 text-base font-bold text-[#1A1A1A]">
          <span>Total</span>
          <span>{formatPrice(summary.total)}</span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[#1A1A1A]/40">
        Impuestos incluidos.
      </p>
    </div>
  );
}
