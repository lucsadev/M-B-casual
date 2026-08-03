import { describe, it, expect } from 'vitest';
import { generateSku, slugifyToken, truncateToken, MAX_RETRY_ATTEMPTS } from '@mbt/shared';

describe('generateSku', () => {
  describe('basic generation', () => {
    it('generates a SKU with all fields (category, product, size, color, ordinal)', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'M',
        color: 'Blanco',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-camisa-oversize-M-BLA-001');
    });

    it('is deterministic for identical inputs', () => {
      const input = {
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'M',
        color: 'Blanco',
        ordinal: 1,
      };
      expect(generateSku(input)).toBe(generateSku(input));
    });

    it('accepts an explicit ordinal when used is not provided', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'S',
        color: 'Blanco',
        ordinal: 2,
      });
      expect(sku).toBe('mujer-camisa-oversize-S-BLA-002');
    });
  });

  describe('color-less variant', () => {
    it('omits the COLOR3 segment when color is null', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'cinto-cuero',
        size: 'Único',
        color: null,
        ordinal: 1,
      });
      expect(sku).toBe('mujer-cinto-cuero-UNI-001');
    });

    it('omits the COLOR3 segment when color is undefined', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'cinto-cuero',
        size: 'Único',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-cinto-cuero-UNI-001');
    });

    it('omits the COLOR3 segment when color is an empty string', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'cinto-cuero',
        size: 'L',
        color: '',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-cinto-cuero-L-001');
    });
  });

  describe('size derivation', () => {
    it('maps "Único" to "UNI"', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'cinto-cuero',
        size: 'Único',
        color: null,
        ordinal: 1,
      });
      expect(sku).toBe('mujer-cinto-cuero-UNI-001');
    });

    it('maps "Única" to "UNI"', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'cinto-cuero',
        size: 'Única',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-cinto-cuero-UNI-001');
    });

    it('maps a null size to "UNI"', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'cinto-cuero',
        size: null,
        ordinal: 1,
      });
      expect(sku).toBe('mujer-cinto-cuero-UNI-001');
    });

    it('slugifies and uppercases a lowercase size ("s" -> "S")', () => {
      const sku = generateSku({
        categorySlug: 'hombre',
        productSlug: 'jean-recto',
        size: 's',
        ordinal: 1,
      });
      expect(sku).toBe('hombre-jean-recto-S-001');
    });

    it('preserves a multi-character uppercase size ("XXL" -> "XXL")', () => {
      const sku = generateSku({
        categorySlug: 'hombre',
        productSlug: 'jean-recto',
        size: 'xxl',
        ordinal: 1,
      });
      expect(sku).toBe('hombre-jean-recto-XXL-001');
    });
  });

  describe('ordinal padding', () => {
    it('zero-pads ordinal 1 as "001"', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'S',
        color: 'Blanco',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-camisa-oversize-S-BLA-001');
    });

    it('zero-pads ordinal 10 as "010"', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'S',
        color: 'Blanco',
        ordinal: 10,
      });
      expect(sku).toBe('mujer-camisa-oversize-S-BLA-010');
    });

    it('zero-pads ordinal 999 as "999"', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'S',
        color: 'Blanco',
        ordinal: 999,
      });
      expect(sku).toBe('mujer-camisa-oversize-S-BLA-999');
    });
  });

  describe('collision avoidance', () => {
    it('increments the ordinal when the generated SKU is already used', () => {
      const sku = generateSku({
        categorySlug: 'hombre',
        productSlug: 'jean-recto',
        size: 'S',
        color: 'Índigo',
        ordinal: 1,
        used: new Set(['hombre-jean-recto-S-ÍND-001']),
      });
      expect(sku).toBe('hombre-jean-recto-S-ÍND-002');
    });

    it('keeps incrementing until a free ordinal is found', () => {
      const sku = generateSku({
        categorySlug: 'hombre',
        productSlug: 'jean-recto',
        size: 'S',
        color: 'Índigo',
        ordinal: 1,
        used: new Set([
          'hombre-jean-recto-S-ÍND-001',
          'hombre-jean-recto-S-ÍND-002',
          'hombre-jean-recto-S-ÍND-003',
        ]),
      });
      expect(sku).toBe('hombre-jean-recto-S-ÍND-004');
    });

    it('returns the requested ordinal when no collision', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'S',
        color: 'Blanco',
        ordinal: 5,
        used: new Set(['mujer-camisa-oversize-S-BLA-001']),
      });
      expect(sku).toBe('mujer-camisa-oversize-S-BLA-005');
    });
  });

  describe('collision cap (T2.3)', () => {
    const baseInput = {
      categorySlug: 'hombre',
      productSlug: 'jean-recto',
      size: 'S',
      color: 'Índigo',
      ordinal: 1,
    };

    // Builds a Set holding N consecutive SKUs (same base) so the generator must
    // retry past each one. Mirrors MAX_RETRY_ATTEMPTS = 100 in the util.
    const buildCollidingUsed = (count: number) =>
      new Set(
        Array.from({ length: count }, (_, i) =>
          `hombre-jean-recto-S-ÍND-${String(i + 1).padStart(3, '0')}`,
        ),
      );

    it('exposes the 100-attempt cap constant', () => {
      expect(MAX_RETRY_ATTEMPTS).toBe(100);
    });

    it('does not engage the cap when no `used` set is supplied', () => {
      // No collision loop runs, so the caller ordinal is used verbatim.
      expect(generateSku(baseInput)).toBe('hombre-jean-recto-S-ÍND-001');
    });

    it('succeeds with exactly 100 colliding SKUs (returns the first free ordinal)', () => {
      // ordinals 001..100 are taken -> 100 retries, then 101 is free.
      const used = buildCollidingUsed(100);
      expect(generateSku({ ...baseInput, used })).toBe('hombre-jean-recto-S-ÍND-101');
    });

    it('throws when more than 100 retry attempts are needed', () => {
      // ordinals 001..101 are taken -> 101st retry exceeds the 100 cap.
      const used = buildCollidingUsed(101);
      expect(() => generateSku({ ...baseInput, used })).toThrow(
        'SKU generation exceeded max retry attempts (100)',
      );
    });
  });

  describe('color truncation', () => {
    it('truncates color to 3 chars and uppercases ("Marfil" -> "MAR")', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'vestido',
        size: 'S',
        color: 'Marfil',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-vestido-S-MAR-001');
    });

    it('preserves diacritics in the color token ("Índigo" -> "ÍND")', () => {
      const sku = generateSku({
        categorySlug: 'hombre',
        productSlug: 'pantalon',
        size: 'S',
        color: 'Índigo',
        ordinal: 1,
      });
      expect(sku).toBe('hombre-pantalon-S-ÍND-001');
    });

    it('truncates multi-word colors keeping the first 3 letters', () => {
      const sku = generateSku({
        categorySlug: 'mujer',
        productSlug: 'camisa-oversize',
        size: 'M',
        color: 'Blanco Roto',
        ordinal: 1,
      });
      expect(sku).toBe('mujer-camisa-oversize-M-BLA-001');
    });
  });
});

describe('slugifyToken', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyToken('Camisa Oversize')).toBe('camisa-oversize');
  });

  it('collapses runs of non-alphanumerics into a single hyphen', () => {
    expect(slugifyToken('Camisa   Oversize')).toBe('camisa-oversize');
    expect(slugifyToken('Camisa-Oversize')).toBe('camisa-oversize');
  });

  it('preserves diacritics (Unicode-aware)', () => {
    expect(slugifyToken('Índigo')).toBe('índigo');
    expect(slugifyToken('Único')).toBe('único');
  });

  it('strips leading/trailing non-alphanumerics', () => {
    expect(slugifyToken('  $Blanco  ')).toBe('blanco');
  });

  it('handles empty/whitespace input', () => {
    expect(slugifyToken('   ')).toBe('');
  });
});

describe('truncateToken', () => {
  it('truncates to 3 chars by default', () => {
    expect(truncateToken('blanco')).toBe('bla');
  });

  it('truncates to a custom length', () => {
    expect(truncateToken('blanco', 4)).toBe('blan');
  });

  it('returns the string when shorter than len', () => {
    expect(truncateToken('bl', 3)).toBe('bl');
  });
});
