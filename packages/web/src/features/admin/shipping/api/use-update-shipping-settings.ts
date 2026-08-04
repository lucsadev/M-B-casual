/**
 * useUpdateShippingSettings — save shipping configuration from admin.
 *
 * Upserts the single-row `shipping_settings` table (id = true). RLS only
 * allows admins to write, enforced by the `is_admin()` policy.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SHIPPING_SETTINGS_QUERY_KEY } from '@/features/shipping/hooks/use-shipping-settings';

export interface UpdateShippingSettingsInput {
  freeShippingMin: number;
  shippingCost: number;
}

async function updateShippingSettings(
  input: UpdateShippingSettingsInput,
): Promise<void> {
  const { error } = await supabase.from('shipping_settings').upsert({
    id: true,
    free_shipping_min: input.freeShippingMin,
    shipping_cost: input.shippingCost,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateShippingSettingsInput>({
    mutationFn: updateShippingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPPING_SETTINGS_QUERY_KEY });
    },
  });
}
