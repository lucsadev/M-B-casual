/**
 * Order status lifecycle for M & B Casual.
 * Matches the `order_status` PostgreSQL enum values.
 */
export interface OrderStatusConstant {
  value: string;
  label: string;
  description: string;
}

export const ORDER_STATUS: OrderStatusConstant[] = [
  {
    value: 'pending',
    label: 'Pendiente',
    description: 'Orden creada, esperando confirmación',
  },
  {
    value: 'confirmed',
    label: 'Confirmada',
    description: 'Pago recibido y orden confirmada',
  },
  {
    value: 'processing',
    label: 'En preparación',
    description: 'El pedido está siendo preparado',
  },
  {
    value: 'shipped',
    label: 'Enviado',
    description: 'El pedido fue despachado',
  },
  {
    value: 'delivered',
    label: 'Entregado',
    description: 'El cliente recibió el pedido',
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    description: 'La orden fue cancelada',
  },
];
