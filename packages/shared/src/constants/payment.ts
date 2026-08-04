export const PAYMENT_METHODS = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: 'bank' },
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];
