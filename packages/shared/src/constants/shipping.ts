export const SHIPPING_COST = 0;
export const FREE_SHIPPING_MIN = 0;

export function calculateTotal(subtotal: number): { subtotal: number; shipping: number; total: number } {
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  return { subtotal, shipping, total: subtotal + shipping };
}
