/**
 * useShippingSettings — fetch shipping configuration from the DB.
 *
 * Reads the single-row `shipping_settings` table (admin-editable) and returns
 * typed `ShippingSettings`. Falls back to free shipping (defaults) if the row
 * is missing or while loading, so the cart/checkout never blocks on this.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_SHIPPING_SETTINGS,
  type ShippingSettings,
} from '@mbt/shared';

export const SHIPPING_SETTINGS_QUERY_KEY = ['shipping-settings'] as const;

export async function fetchShippingSettings(): Promise<ShippingSettings> {
  const { data, error } = await supabase
    .from('shipping_settings')
    .select('free_shipping_min, shipping_cost')
    .eq('id', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) return DEFAULT_SHIPPING_SETTINGS;

  return {
    freeShippingMin: Number(data.free_shipping_min ?? 0),
    shippingCost: Number(data.shipping_cost ?? 0),
  };
}

export function useShippingSettings(): ShippingSettings {
  const { data = DEFAULT_SHIPPING_SETTINGS } = useQuery({
    queryKey: SHIPPING_SETTINGS_QUERY_KEY,
    queryFn: fetchShippingSettings,
    staleTime: 1000 * 60 * 5,
  });
  return data;
}
