/**
 * useBankTransferSettings — fetch bank transfer configuration from the DB.
 *
 * Reads the single-row `bank_transfer_settings` table (admin-editable) and
 * returns typed `BankTransferSettings`. Falls back to defaults if the row
 * is missing or while loading.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_BANK_TRANSFER_SETTINGS,
  type BankTransferSettings,
} from '@mbt/shared';

export const BANK_TRANSFER_SETTINGS_QUERY_KEY = ['bank-transfer-settings'] as const;

export async function fetchBankTransferSettings(): Promise<BankTransferSettings> {
  const { data, error } = await supabase
    .from('bank_transfer_settings')
    .select('alias, cbu, titular, banco, extra_info')
    .eq('id', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) return DEFAULT_BANK_TRANSFER_SETTINGS;

  return {
    alias: data.alias ?? '',
    cbu: data.cbu ?? '',
    titular: data.titular ?? '',
    banco: data.banco ?? '',
    extraInfo: data.extra_info ?? '',
  };
}

export function useBankTransferSettings(): BankTransferSettings {
  const { data = DEFAULT_BANK_TRANSFER_SETTINGS } = useQuery({
    queryKey: BANK_TRANSFER_SETTINGS_QUERY_KEY,
    queryFn: fetchBankTransferSettings,
    staleTime: 1000 * 60 * 5,
  });
  return data;
}
