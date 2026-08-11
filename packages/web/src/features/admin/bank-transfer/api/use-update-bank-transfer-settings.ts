/**
 * useUpdateBankTransferSettings — save bank transfer configuration from admin.
 *
 * Upserts the single-row `bank_transfer_settings` table (id = true). RLS only
 * allows admins to write, enforced by the `is_admin()` policy.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BANK_TRANSFER_SETTINGS_QUERY_KEY } from '@/features/shipping/hooks/use-bank-transfer-settings';

export interface UpdateBankTransferSettingsInput {
  alias: string;
  cbu: string;
  titular: string;
  banco: string;
  extraInfo: string;
}

async function updateBankTransferSettings(
  input: UpdateBankTransferSettingsInput,
): Promise<void> {
  const { error } = await supabase.from('bank_transfer_settings').upsert({
    id: true,
    alias: input.alias,
    cbu: input.cbu,
    titular: input.titular,
    banco: input.banco,
    extra_info: input.extraInfo,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export function useUpdateBankTransferSettings() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateBankTransferSettingsInput>({
    mutationFn: updateBankTransferSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_TRANSFER_SETTINGS_QUERY_KEY });
    },
  });
}
