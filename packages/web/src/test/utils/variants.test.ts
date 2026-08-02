import { describe, it, expect } from 'vitest';
import {
  getAvailableSizes,
  getAvailableColors,
  getFirstInStockSize,
  resolveInStockVariantId,
  resolveDefaultSelection,
  resolveNextSizeOnColorChange,
  resolveNextSizeOnSizeTap,
  type ProductVariant,
} from '@mbt/shared';

function variant(
  overrides: Partial<ProductVariant> & Pick<ProductVariant, 'id'>,
): ProductVariant {
  return {
    productId: 'prod-1',
    createdAt: '2026-01-01T00:00:00Z',
    stock: 0,
    ...overrides,
  };
}

const variants: ProductVariant[] = [
  variant({ id: 'v1', size: 'S', color: 'Negro', stock: 3 }),
  variant({ id: 'v2', size: 'M', color: 'Negro', stock: 5 }),
  variant({ id: 'v3', size: 'L', color: 'Negro', stock: 0 }),
  variant({ id: 'v4', size: 'M', color: 'Blanco', stock: 2 }),
  variant({ id: 'v5', size: 'XL', color: 'Blanco', stock: 0 }),
  variant({ id: 'v6', size: 'Único', color: 'Marfil', stock: 1 }),
  variant({ id: 'v7', size: 'unico', color: 'Marfil', stock: 1 }),
];

// Edge-case fixture: same size present with stock 0 in one color and stock > 0
// in another, plus a color whose every variant has stock 0.
const edgeVariants: ProductVariant[] = [
  variant({ id: 'e1', size: 'XXL', color: 'Negro', stock: 0 }),
  variant({ id: 'e2', size: 'XXL', color: 'Blanco', stock: 2 }),
  variant({ id: 'e3', size: 'S', color: 'Rojo', stock: 0 }),
];

// Fixture where the first in-stock variant in ARRAY order (M/Negro) is NOT the
// canonical default (S comes before M) — proves resolveDefaultSelection ignores
// array order, matching the confirmed web/mobile divergence example.
const nonCanonicalOrderVariants: ProductVariant[] = [
  variant({ id: 'n1', size: 'M', color: 'Negro', stock: 5 }),
  variant({ id: 'n2', size: 'S', color: 'Blanco', stock: 1 }),
];

// Fixture with variants that have no color at all.
const noColorVariants: ProductVariant[] = [
  variant({ id: 'nc1', size: 'S', stock: 3 }),
  variant({ id: 'nc2', size: 'M', stock: 2 }),
];

// Fixture where the canonical first size has a color-less in-stock variant
// before a color-carrying one — the color-carrying one must win.
const mixedColorVariants: ProductVariant[] = [
  variant({ id: 'mc1', size: 'S', stock: 5 }),
  variant({ id: 'mc2', size: 'S', color: 'Negro', stock: 2 }),
];

// Fixture with no in-stock variant at all.
const allOutOfStockVariants: ProductVariant[] = [
  variant({ id: 'os1', size: 'S', color: 'Negro', stock: 0 }),
  variant({ id: 'os2', size: 'M', color: 'Blanco', stock: 0 }),
];

describe('getAvailableSizes', () => {
  it('returns all in-stock sizes sorted in canonical order when no color is selected', () => {
    expect(getAvailableSizes(variants)).toEqual(['S', 'M', 'Único', 'unico']);
  });

  it('returns only the in-stock sizes of the selected color', () => {
    expect(getAvailableSizes(variants, 'Negro')).toEqual(['S', 'M']);
    expect(getAvailableSizes(variants, 'Blanco')).toEqual(['M']);
  });

  it('excludes stock = 0 sizes even when they match the selected color', () => {
    expect(getAvailableSizes(variants, 'Negro')).not.toContain('L');
    expect(getAvailableSizes(variants, 'Blanco')).not.toContain('XL');
  });

  it('returns an empty array when the color has no in-stock sizes', () => {
    expect(getAvailableSizes(variants, 'Inexistente')).toEqual([]);
  });
});

describe('getAvailableColors', () => {
  it('returns only colors that have at least one in-stock variant', () => {
    expect(getAvailableColors(variants)).toEqual(['Negro', 'Blanco', 'Marfil']);
  });
});

describe('resolveInStockVariantId', () => {
  it('resolves to null when nothing is selected (no implicit variant)', () => {
    // A blank selection must not enable Add with a silently chosen variant —
    // explicit nulls and absent args both mean "no selection".
    expect(resolveInStockVariantId(variants)).toBeNull();
    expect(resolveInStockVariantId(variants, null, null)).toBeNull();
  });

  it('resolves the matching in-stock variant for size + color', () => {
    expect(resolveInStockVariantId(variants, 'M', 'Negro')).toBe('v2');
    expect(resolveInStockVariantId(variants, 'M', 'Blanco')).toBe('v4');
  });

  it('never resolves a stock = 0 variant', () => {
    // L is only present with stock 0 in Negro — should not be returned.
    expect(resolveInStockVariantId(variants, 'L', 'Negro')).toBeNull();
    // XL is only present with stock 0 in Blanco — should not be returned.
    expect(resolveInStockVariantId(variants, 'XL', 'Blanco')).toBeNull();
  });

  it('resolves a size-only selection to an in-stock variant', () => {
    expect(resolveInStockVariantId(variants, 'M', null)).toBe('v2');
  });

  it('resolves a color-only selection to the first in-stock variant of that color', () => {
    expect(resolveInStockVariantId(variants, null, 'Negro')).toBe('v1');
    expect(resolveInStockVariantId(variants, null, 'Blanco')).toBe('v4');
  });

  it('returns null when the color has no in-stock variants', () => {
    expect(resolveInStockVariantId(variants, null, 'Inexistente')).toBeNull();
  });
});

describe('getFirstInStockSize', () => {
  it('returns the first in-stock size across all colors in canonical order', () => {
    expect(getFirstInStockSize(variants)).toBe('S');
  });

  it('returns the first in-stock size of the given color in canonical order', () => {
    expect(getFirstInStockSize(variants, 'Negro')).toBe('S');
    expect(getFirstInStockSize(variants, 'Blanco')).toBe('M');
    expect(getFirstInStockSize(variants, 'Marfil')).toBe('Único');
  });

  it('returns null when the color has no in-stock sizes', () => {
    expect(getFirstInStockSize(variants, 'Inexistente')).toBeNull();
  });

  it('returns null when every variant of a present color has stock 0', () => {
    expect(getFirstInStockSize(edgeVariants, 'Rojo')).toBeNull();
  });

  it('returns null for an empty variants array', () => {
    expect(getFirstInStockSize([])).toBeNull();
  });
});

describe('resolveDefaultSelection', () => {
  it('picks the canonical-order first in-stock size, not array order', () => {
    // Array order starts with M/Negro, but S comes first canonically — web and
    // mobile must both start on S/Blanco.
    expect(resolveDefaultSelection(nonCanonicalOrderVariants)).toEqual({
      size: 'S',
      color: 'Blanco',
    });
  });

  it('picks the canonical first size and its color from the base fixture', () => {
    expect(resolveDefaultSelection(variants)).toEqual({
      size: 'S',
      color: 'Negro',
    });
  });

  it('works when the first canonical size exists in another color', () => {
    // Only XXL/Blanco has stock, so the default is XXL/Blanco (canonical
    // first in-stock size even though Rojo/S precedes it with stock 0).
    expect(resolveDefaultSelection(edgeVariants)).toEqual({
      size: 'XXL',
      color: 'Blanco',
    });
  });

  it('returns a null color when the selected size has no colored variant', () => {
    expect(resolveDefaultSelection(noColorVariants)).toEqual({
      size: 'S',
      color: null,
    });
  });

  it('prefers a color-carrying variant over a color-less one of the same size', () => {
    expect(resolveDefaultSelection(mixedColorVariants)).toEqual({
      size: 'S',
      color: 'Negro',
    });
  });

  it('returns null size and color when nothing is in stock', () => {
    expect(resolveDefaultSelection(allOutOfStockVariants)).toEqual({
      size: null,
      color: null,
    });
  });

  it('returns null size and color for an empty variants array', () => {
    expect(resolveDefaultSelection([])).toEqual({ size: null, color: null });
  });
});

describe('resolveNextSizeOnColorChange', () => {
  it('auto-selects the first in-stock size of the new color when the current size is unavailable', () => {
    // S is not in stock in Blanco — auto-selects M.
    expect(resolveNextSizeOnColorChange(variants, 'S', 'Blanco')).toBe('M');
    // L is not in stock in Negro — auto-selects S.
    expect(resolveNextSizeOnColorChange(variants, 'L', 'Negro')).toBe('S');
  });

  it('keeps the current size when it is still in stock in the new color', () => {
    expect(resolveNextSizeOnColorChange(variants, 'M', 'Blanco')).toBe('M');
    expect(resolveNextSizeOnColorChange(variants, 'S', 'Negro')).toBe('S');
  });

  it('auto-selects a size when none is currently selected', () => {
    expect(resolveNextSizeOnColorChange(variants, null, 'Negro')).toBe('S');
    expect(resolveNextSizeOnColorChange(variants, null, 'Blanco')).toBe('M');
  });

  it('returns null when the color is deselected (forces an explicit re-pick)', () => {
    // Deselecting a color must clear the size too — never silently resolve to
    // a variant of a color the user did not pick.
    expect(resolveNextSizeOnColorChange(variants, 'M', null)).toBeNull();
    expect(resolveNextSizeOnColorChange(variants, 'M', undefined)).toBeNull();
  });

  it('returns null when the new color has no in-stock sizes', () => {
    expect(resolveNextSizeOnColorChange(edgeVariants, 'XXL', 'Rojo')).toBeNull();
    expect(resolveNextSizeOnColorChange(variants, 'M', 'Inexistente')).toBeNull();
  });
});

describe('resolveNextSizeOnSizeTap', () => {
  it('returns null when tapping the already-selected size (no-toggle)', () => {
    expect(resolveNextSizeOnSizeTap(variants, 'S', 'S', 'Negro')).toBeNull();
  });

  it('returns the tapped size when tapping a different size', () => {
    expect(resolveNextSizeOnSizeTap(variants, 'S', 'M', 'Negro')).toBe('M');
  });

  it('returns the tapped size when no size is currently selected', () => {
    expect(resolveNextSizeOnSizeTap(variants, null, 'S', null)).toBe('S');
  });
});

describe('empty variants array', () => {
  it('returns empty lists and null resolutions', () => {
    expect(getAvailableSizes([])).toEqual([]);
    expect(getAvailableColors([])).toEqual([]);
    expect(resolveInStockVariantId([])).toBeNull();
  });
});

describe('color present in data but with all stock 0', () => {
  it('is excluded from colors, sizes, and resolution', () => {
    expect(getAvailableColors(edgeVariants)).toEqual(['Blanco']);
    expect(getAvailableSizes(edgeVariants, 'Rojo')).toEqual([]);
    expect(resolveInStockVariantId(edgeVariants, null, 'Rojo')).toBeNull();
  });
});

describe('undefined vs null color argument', () => {
  it('treats undefined and null identically', () => {
    expect(getAvailableSizes(variants, undefined)).toEqual(
      getAvailableSizes(variants, null),
    );
    expect(getFirstInStockSize(variants, undefined)).toBe(
      getFirstInStockSize(variants, null),
    );
    expect(resolveInStockVariantId(variants, 'M', undefined)).toBe(
      resolveInStockVariantId(variants, 'M', null),
    );
    expect(resolveInStockVariantId(variants, undefined, undefined)).toBe(
      resolveInStockVariantId(variants, null, null),
    );
  });
});

describe('size-only resolution skips 0-stock variants', () => {
  it('resolves to an in-stock variant of the same size in another color', () => {
    // XXL has stock 0 in Negro but stock 2 in Blanco — must skip e1 and return e2.
    expect(resolveInStockVariantId(edgeVariants, 'XXL', null)).toBe('e2');
  });

  it('returns null when the size is out of stock in every color', () => {
    // 'S' only exists in Rojo with stock 0.
    expect(resolveInStockVariantId(edgeVariants, 'S', null)).toBeNull();
  });
});
