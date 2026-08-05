/**
 * Supplier validator tests.
 *
 * Covers supplierFormSchema (create/edit input normalization) and
 * supplierSchema (full entity shape). The shared package has no test runner,
 * so these run under the web vitest suite via the @mbt/shared alias.
 */
import { describe, it, expect } from 'vitest';
import { supplierFormSchema, supplierSchema } from '@mbt/shared';

describe('supplierFormSchema', () => {
  it('accepts a valid supplier input', () => {
    const result = supplierFormSchema.safeParse({
      name: 'Textil Ríos',
      website: 'https://textilrios.com',
      instagram: 'https://instagram.com/textilrios',
      email: 'ventas@textilrios.com',
      phone: '11 5555 1234',
      address: 'Av. Corrientes 1234',
      isActive: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Textil Ríos');
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects an empty name', () => {
    const result = supplierFormSchema.safeParse({ name: '' });

    expect(result.success).toBe(false);
  });

  it('normalizes an empty email to undefined', () => {
    const result = supplierFormSchema.safeParse({
      name: 'Textil Ríos',
      email: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
    }
  });

  it('defaults isActive to true when omitted', () => {
    const result = supplierFormSchema.safeParse({ name: 'Textil Ríos' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects an invalid email', () => {
    const result = supplierFormSchema.safeParse({
      name: 'Textil Ríos',
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });
});

describe('supplierSchema', () => {
  it('accepts a full supplier entity', () => {
    const result = supplierSchema.safeParse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Textil Ríos',
      website: 'https://textilrios.com',
      instagram: 'https://instagram.com/textilrios',
      email: 'ventas@textilrios.com',
      phone: '11 5555 1234',
      address: 'Av. Corrientes 1234',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a supplier with only required fields', () => {
    const result = supplierSchema.safeParse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Textil Ríos',
      isActive: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a supplier with an invalid email', () => {
    const result = supplierSchema.safeParse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Textil Ríos',
      email: 'invalid',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    expect(result.success).toBe(false);
  });
});
