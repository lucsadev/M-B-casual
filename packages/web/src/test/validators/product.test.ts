import { describe, it, expect } from 'vitest';
import { productSchema, productCreateSchema } from '@mbt/shared';

describe('productSchema', () => {
  const validProduct = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Camisa Oversize Blanca',
    slug: 'camisa-oversize-blanca',
    description: 'Una camisa blanca oversize',
    price: 15000,
    comparePrice: 18000,
    images: ['https://example.com/image.jpg'],
    tags: ['nuevo', 'oferta'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
  };

  it('accepts a valid product', () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('rejects product without name', () => {
    const result = productSchema.safeParse({ ...validProduct, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('rejects product with negative price', () => {
    const result = productSchema.safeParse({ ...validProduct, price: -100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('price'))).toBe(true);
    }
  });

  it('rejects product with invalid UUID', () => {
    const result = productSchema.safeParse({ ...validProduct, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects product without required fields', () => {
    const result = productSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('productCreateSchema', () => {
  const validInput = {
    categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Camisa Oversize Blanca',
    price: 15000,
  };

  it('accepts minimal valid input', () => {
    const result = productCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const result = productCreateSchema.safeParse(validInput);
    if (result.success) {
      expect(result.data.images).toEqual([]);
      expect(result.data.tags).toEqual([]);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects without name', () => {
    const result = productCreateSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects with negative price', () => {
    const result = productCreateSchema.safeParse({ ...validInput, price: -1 });
    expect(result.success).toBe(false);
  });
});

describe('product cost field', () => {
  it('productSchema accepts cost >= 0', () => {
    const base = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Camisa Oversize Blanca',
      slug: 'camisa-oversize-blanca',
      price: 15000,
      images: [],
      tags: [],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-15T12:00:00Z',
    };
    expect(productSchema.safeParse({ ...base, cost: 0 }).success).toBe(true);
    expect(productSchema.safeParse({ ...base, cost: 9000 }).success).toBe(true);
  });

  it('productSchema rejects negative cost', () => {
    const base = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Camisa Oversize Blanca',
      slug: 'camisa-oversize-blanca',
      price: 15000,
      images: [],
      tags: [],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-15T12:00:00Z',
    };
    const result = productSchema.safeParse({ ...base, cost: -100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('cost')),
      ).toBe(true);
    }
  });

  it('productSchema accepts undefined cost', () => {
    const base = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Camisa Oversize Blanca',
      slug: 'camisa-oversize-blanca',
      price: 15000,
      images: [],
      tags: [],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-15T12:00:00Z',
    };
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it('productCreateSchema accepts cost >= 0', () => {
    const base = {
      categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Camisa Oversize Blanca',
      price: 15000,
    };
    expect(productCreateSchema.safeParse({ ...base, cost: 12000 }).success).toBe(
      true,
    );
  });

  it('productCreateSchema rejects negative cost', () => {
    const base = {
      categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Camisa Oversize Blanca',
      price: 15000,
    };
    const result = productCreateSchema.safeParse({ ...base, cost: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('cost')),
      ).toBe(true);
    }
  });

  it('productCreateSchema accepts undefined cost', () => {
    const base = {
      categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Camisa Oversize Blanca',
      price: 15000,
    };
    expect(productCreateSchema.safeParse(base).success).toBe(true);
  });
});
