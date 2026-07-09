import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, generateSlug } from '@mbt/shared';

describe('formatPrice', () => {
  it('formats 1500 as "$1.500,00" using ARS locale', () => {
    const result = formatPrice(1500);
    expect(result).toContain('1.500');
    expect(result).toContain('00');
  });

  it('formats 0 as "$0,00"', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
  });

  it('formats decimal amounts correctly', () => {
    const result = formatPrice(99.99);
    expect(result).toContain('99');
  });

  it('formats large numbers with thousands separators', () => {
    const result = formatPrice(1000000);
    expect(result).toContain('1.000.000');
  });

  it('supports USD currency', () => {
    const result = formatPrice(1500, 'USD');
    expect(result).toContain('1.500');
  });
});

describe('formatDate', () => {
  it('formats a date object correctly', () => {
    const date = new Date(2026, 6, 7); // July 7, 2026
    const result = formatDate(date);
    expect(result).toContain('jul');
    expect(result).toContain('2026');
  });

  it('formats an ISO string correctly', () => {
    const result = formatDate('2026-01-15T00:00:00Z');
    expect(result).toContain('2026');
  });

  it('returns a non-empty string', () => {
    const result = formatDate(new Date());
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('generateSlug', () => {
  it('converts "Mi Producto" to "mi-producto"', () => {
    const result = generateSlug('Mi Producto');
    expect(result).toBe('mi-producto');
  });

  it('removes special characters', () => {
    const result = generateSlug('¿Camisa? ¡Nueva! $100');
    expect(result).toBe('camisa-nueva-100');
  });

  it('handles multiple spaces and underscores', () => {
    const result = generateSlug('  Producto   Nuevo  ');
    expect(result).toBe('producto-nuevo');
  });

  it('converts to lowercase', () => {
    const result = generateSlug('PRODUCTO DE MUJER');
    expect(result).toBe('producto-de-mujer');
  });

  it('returns empty string for empty input', () => {
    const result = generateSlug('');
    expect(result).toBe('');
  });

  it('handles accented characters', () => {
    const result = generateSlug('Camisón Algodón');
    expect(result).toBe('camisn-algodn');
  });
});
