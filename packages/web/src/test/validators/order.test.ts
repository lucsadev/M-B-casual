import { describe, it, expect } from 'vitest';
import { orderSchema, orderCreateSchema, orderItemSchema } from '@mbt/shared';

describe('orderSchema', () => {
  const validOrder = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    customerId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    status: 'pending',
    total: 25000,
    shippingCost: 1500,
    discount: 0,
    paymentMethod: 'mp',
    paymentStatus: 'pending',
    notes: 'Dejar en recepción',
    shippingAddress: { street: 'Av. Siempreviva 123' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('accepts a valid order', () => {
    const result = orderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('rejects order with invalid status', () => {
    const result = orderSchema.safeParse({ ...validOrder, status: 'invalid_status' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true);
    }
  });

  it('rejects order with negative total', () => {
    const result = orderSchema.safeParse({ ...validOrder, total: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts all valid order statuses', () => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (const status of statuses) {
      const result = orderSchema.safeParse({ ...validOrder, status });
      expect(result.success).toBe(true);
    }
  });
});

describe('orderCreateSchema', () => {
  const validInput = {
    customerId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    total: 25000,
  };

  it('accepts minimal valid input', () => {
    const result = orderCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('applies defaults', () => {
    const result = orderCreateSchema.safeParse(validInput);
    if (result.success) {
      expect(result.data.status).toBe('pending');
      expect(result.data.paymentStatus).toBe('pending');
      expect(result.data.shippingCost).toBe(0);
      expect(result.data.discount).toBe(0);
    }
  });
});

describe('orderItemSchema', () => {
  const validItem = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    orderId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    productId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    quantity: 2,
    unitPrice: 12500,
    subtotal: 25000,
  };

  it('accepts a valid order item', () => {
    const result = orderItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('rejects item with zero quantity', () => {
    const result = orderItemSchema.safeParse({ ...validItem, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects item with negative unit price', () => {
    const result = orderItemSchema.safeParse({ ...validItem, unitPrice: -10 });
    expect(result.success).toBe(false);
  });
});
