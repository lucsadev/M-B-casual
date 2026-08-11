/**
 * Bank transfer configuration.
 *
 * Values are stored in the `bank_transfer_settings` table (admin-editable)
 * and displayed on the order confirmation page + sent as in-app message
 * when the customer pays by transferencia.
 */
export interface BankTransferSettings {
  alias: string;
  cbu: string;
  titular: string;
  banco: string;
  extraInfo: string;
}

export const DEFAULT_BANK_TRANSFER_SETTINGS: BankTransferSettings = {
  alias: '',
  cbu: '',
  titular: '',
  banco: '',
  extraInfo: '',
};

/**
 * Returns true if the transfer settings have at least a CBU or alias + titular
 * configured (i.e. meaningful enough to display/send).
 */
export function hasTransferSettings(settings: BankTransferSettings): boolean {
  const hasAccount = settings.alias.trim() !== '' || settings.cbu.trim() !== '';
  const hasHolder = settings.titular.trim() !== '' || settings.banco.trim() !== '';
  return hasAccount && hasHolder;
}
