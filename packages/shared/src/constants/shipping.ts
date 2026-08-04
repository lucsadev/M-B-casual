/**
 * Shipping configuration.
 *
 * Values are stored in the `shipping_settings` table (admin-editable) and
 * fetched at runtime by web/mobile cart hooks. These defaults are safe
 * fallbacks (free shipping) used while settings load or if the row is missing.
 */
export interface ShippingSettings {
  freeShippingMin: number;
  shippingCost: number;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  freeShippingMin: 0,
  shippingCost: 0,
};

export function calculateTotal(
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
): { subtotal: number; shipping: number; total: number } {
  const shipping =
    subtotal >= settings.freeShippingMin ? 0 : settings.shippingCost;
  return { subtotal, shipping, total: subtotal + shipping };
}
