export const PAYMENT_METHODS = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: 'bank' },
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { id: 'mercado_pago', label: 'Mercado Pago', icon: 'credit-card' },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];
