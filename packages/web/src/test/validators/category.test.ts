import { describe, it, expect } from 'vitest';
import { categorySchema, categoryCreateSchema } from '@mbt/shared';

describe('categorySchema', () => {
  const validCategory = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Mujer',
    slug: 'mujer',
    description: 'Ropa y accesorios para mujer',
    imageUrl: 'https://example.com/mujer.jpg',
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('accepts a valid category', () => {
    const result = categorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it('accepts category without optional fields', () => {
    const { description, imageUrl, ...minimal } = validCategory;
    const result = categorySchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('rejects category without slug', () => {
    const result = categorySchema.safeParse({ ...validCategory, slug: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('slug'))).toBe(true);
    }
  });

  it('rejects category without name', () => {
    const result = categorySchema.safeParse({ ...validCategory, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('rejects category with invalid UUID', () => {
    const result = categorySchema.safeParse({ ...validCategory, id: 'bad-id' });
    expect(result.success).toBe(false);
  });
});

describe('categoryCreateSchema', () => {
  it('accepts minimal valid input', () => {
    const result = categoryCreateSchema.safeParse({
      name: 'Hombre',
    });
    expect(result.success).toBe(true);
  });

  it('applies default sortOrder', () => {
    const result = categoryCreateSchema.safeParse({
      name: 'Hombre',
    });
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
    }
  });
});
