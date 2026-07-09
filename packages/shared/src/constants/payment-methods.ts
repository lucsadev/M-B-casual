/**
 * Supported payment methods for M & B Casual.
 */
export interface PaymentMethodConstant {
  value: string;
  label: string;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethodConstant[] = [
  {
    value: 'transferencia',
    label: 'Transferencia bancaria',
    description: 'Pago por transferencia o depósito bancario',
  },
  {
    value: 'efectivo',
    label: 'Efectivo',
    description: 'Pago en efectivo (entrega personal o retiro)',
  },
  {
    value: 'mp',
    label: 'Mercado Pago',
    description: 'Pago a través de Mercado Pago (tarjeta/débito/QR)',
  },
];
