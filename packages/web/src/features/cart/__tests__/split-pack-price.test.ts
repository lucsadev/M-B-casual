/**
 * splitPackPrice unit tests.
 *
 * Covers the integer-cents splitting algorithm:
 * - Even split across N rows
 * - Odd total with remainder absorbed by the last row
 * - Collapsed quantity (repeated variant → single row)
 * - Discounted base computation
 * - Invalid packUnits rejection
 * - Edge cases: single row group, large quantities
 */
import { describe, it, expect } from 'vitest';
import { splitPackPrice, computeCartSubtotal } from '@mbt/shared';

describe('splitPackPrice', () => {
  // -------------------------------------------------------------------
  // Even splits
  // -------------------------------------------------------------------
  it('splits an even total across 2 rows (no remainder)', () => {
    const r1 = splitPackPrice({ total: 20000, packUnits: 2, rowIndex: 1, rowCount: 2 });
    const r2 = splitPackPrice({ total: 20000, packUnits: 2, rowIndex: 2, rowCount: 2 });

    expect(r1.unitPrice).toBe(10000);
    expect(r1.subtotal).toBe(10000);
    expect(r2.unitPrice).toBe(10000);
    expect(r2.subtotal).toBe(10000);

    // Sum must equal the pack total exactly
    expect(r1.subtotal + r2.subtotal).toBe(20000);
  });

  it('splits an even total across 3 rows (divisible by 3)', () => {
    const r1 = splitPackPrice({ total: 30000, packUnits: 3, rowIndex: 1, rowCount: 3 });
    const r2 = splitPackPrice({ total: 30000, packUnits: 3, rowIndex: 2, rowCount: 3 });
    const r3 = splitPackPrice({ total: 30000, packUnits: 3, rowIndex: 3, rowCount: 3 });

    expect(r1.subtotal + r2.subtotal + r3.subtotal).toBe(30000);
  });

  // -------------------------------------------------------------------
  // Odd totals — remainder absorption
  // -------------------------------------------------------------------
  it('absorbs the 1-cent remainder on the last row for a x3 pack', () => {
    const r1 = splitPackPrice({ total: 10000, packUnits: 3, rowIndex: 1, rowCount: 3 });
    const r2 = splitPackPrice({ total: 10000, packUnits: 3, rowIndex: 2, rowCount: 3 });
    const r3 = splitPackPrice({ total: 10000, packUnits: 3, rowIndex: 3, rowCount: 3 });

    // 1000000 cents / 3 = 333333.333 → floor = 333333
    expect(r1.unitPrice).toBe(3333.33);
    expect(r1.subtotal).toBe(3333.33);
    expect(r2.unitPrice).toBe(3333.33);
    expect(r2.subtotal).toBe(3333.33);

    // Last row absorbs the 1-cent remainder
    expect(r3.unitPrice).toBe(3333.33);
    expect(r3.subtotal).toBe(3333.34);

    expect(r1.subtotal + r2.subtotal + r3.subtotal).toBe(10000);
  });

  it('absorbs a multi-cent remainder on the last row', () => {
    // 10001 * 100 = 1000100 cents / 3 = 333366.666 → floor = 333366, remainder = 2
    const r1 = splitPackPrice({ total: 10001, packUnits: 3, rowIndex: 1, rowCount: 3 });
    const r2 = splitPackPrice({ total: 10001, packUnits: 3, rowIndex: 2, rowCount: 3 });
    const r3 = splitPackPrice({ total: 10001, packUnits: 3, rowIndex: 3, rowCount: 3 });

    expect(r1.subtotal + r2.subtotal + r3.subtotal).toBe(10001);
  });

  // -------------------------------------------------------------------
  // Collapsed quantity (repeated variant → single row)
  // -------------------------------------------------------------------
  it('returns the full pack total as subtotal for a single-row collapsed group', () => {
    // x3 pack, all same variant → 1 row with quantity 3
    const r = splitPackPrice({ total: 10000, packUnits: 3, quantity: 3, rowIndex: 1, rowCount: 1 });

    expect(r.subtotal).toBe(10000);
    // unitPrice is the per-unit floor: 3333.33
    expect(r.unitPrice).toBe(3333.33);
  });

  it('collapses 2 rows into 1 with quantity 2', () => {
    // x2 pack, both same variant → 1 row qty 2
    const r = splitPackPrice({ total: 20000, packUnits: 2, quantity: 2, rowIndex: 1, rowCount: 1 });

    expect(r.subtotal).toBe(20000);
    expect(r.unitPrice).toBe(10000);
  });

  // -------------------------------------------------------------------
  // Discounted base
  // -------------------------------------------------------------------
  it('applies variant discount to the split base', () => {
    // x2 pack $20,000, 10% off on this variant row
    const r = splitPackPrice({ total: 20000, packUnits: 2, discount: 10, rowIndex: 1, rowCount: 2 });

    // discounted cents = 2000000 * 0.9 = 1800000 → perUnit = 900000 → $9000
    expect(r.unitPrice).toBe(9000);
    expect(r.subtotal).toBe(9000);
  });

  it('sums discounted rows to the discounted total', () => {
    // Row 1 has 10% discount, Row 2 has 0% — mixed discount
    const r1 = splitPackPrice({ total: 20000, packUnits: 2, discount: 10, rowIndex: 1, rowCount: 2 });
    const r2 = splitPackPrice({ total: 20000, packUnits: 2, discount: 0, rowIndex: 2, rowCount: 2 });

    // Each row splits its OWN discounted base independently.
    // Row 1: base = 1800000 → perUnit = 900000 → $9000, sub = $9000
    // Row 2: base = 2000000 → perUnit = 1000000 → $10000, sub = $10000
    expect(r1.subtotal + r2.subtotal).toBe(19000);
  });

  // -------------------------------------------------------------------
  // Default parameters
  // -------------------------------------------------------------------
  it('defaults quantity to 1 and discount to 0', () => {
    const r = splitPackPrice({ total: 20000, packUnits: 2, rowIndex: 1, rowCount: 2 });

    expect(r.unitPrice).toBe(10000);
    expect(r.subtotal).toBe(10000);
  });

  // -------------------------------------------------------------------
  // Invalid packUnits
  // -------------------------------------------------------------------
  it('throws when packUnits is 1', () => {
    expect(() =>
      splitPackPrice({ total: 10000, packUnits: 1, rowIndex: 1, rowCount: 1 }),
    ).toThrow('packUnits must be >= 2');
  });

  it('throws when packUnits is 0', () => {
    expect(() =>
      splitPackPrice({ total: 10000, packUnits: 0, rowIndex: 1, rowCount: 1 }),
    ).toThrow('packUnits must be >= 2');
  });

  it('throws when packUnits is negative', () => {
    expect(() =>
      splitPackPrice({ total: 10000, packUnits: -1, rowIndex: 1, rowCount: 1 }),
    ).toThrow('packUnits must be >= 2');
  });

  // -------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------
  it('handles zero total', () => {
    const r1 = splitPackPrice({ total: 0, packUnits: 2, rowIndex: 1, rowCount: 2 });
    const r2 = splitPackPrice({ total: 0, packUnits: 2, rowIndex: 2, rowCount: 2 });

    expect(r1.unitPrice).toBe(0);
    expect(r1.subtotal).toBe(0);
    expect(r2.unitPrice).toBe(0);
    expect(r2.subtotal).toBe(0);
  });

  it('handles fractional ARS totals', () => {
    // $150.50 x2 = 15050 cents / 2 = 7525 per unit
    const r1 = splitPackPrice({ total: 150.5, packUnits: 2, rowIndex: 1, rowCount: 2 });
    const r2 = splitPackPrice({ total: 150.5, packUnits: 2, rowIndex: 2, rowCount: 2 });

    expect(r1.subtotal + r2.subtotal).toBe(150.5);
  });
});

describe('computeCartSubtotal', () => {
  it('counts a pack group once, using products.price', () => {
    const items = [
      // Pack x2 — two cart rows, each with the FULL unit_price
      {
        product_id: 'pack-1',
        pack_units: 2,
        unit_price: 3500,
        quantity: 1,
        product_price: 3500,
      },
      {
        product_id: 'pack-1',
        pack_units: 2,
        unit_price: 3500,
        quantity: 1,
        product_price: 3500,
      },
      // Regular item
      {
        product_id: 'solo-1',
        pack_units: null,
        unit_price: 1000,
        quantity: 2,
        product_price: 1000,
      },
    ];

    // 3500 (pack total) + 2000 (solo) = 5500 — NOT 9000
    expect(computeCartSubtotal(items)).toBe(5500);
  });

  it('handles a collapsed pack row (repeated variant, quantity > 1)', () => {
    const items = [
      {
        product_id: 'pack-1',
        pack_units: 2,
        unit_price: 10000,
        quantity: 2, // both slots same variant → collapsed
        product_price: 10000,
      },
    ];

    // One pack group → products.price exactly once
    expect(computeCartSubtotal(items)).toBe(10000);
  });

  it('handles multiple distinct pack groups', () => {
    const items = [
      { product_id: 'p1', pack_units: 2, unit_price: 5000, quantity: 1, product_price: 5000 },
      { product_id: 'p1', pack_units: 2, unit_price: 5000, quantity: 1, product_price: 5000 },
      { product_id: 'p2', pack_units: 3, unit_price: 9000, quantity: 1, product_price: 9000 },
      { product_id: 'p2', pack_units: 3, unit_price: 9000, quantity: 1, product_price: 9000 },
      { product_id: 'p2', pack_units: 3, unit_price: 9000, quantity: 1, product_price: 9000 },
    ];

    // 5000 + 9000 = 14000
    expect(computeCartSubtotal(items)).toBe(14000);
  });

  it('treats items without pack_units as regular line items', () => {
    const items = [
      { product_id: 'a', pack_units: null, unit_price: 100, quantity: 3, product_price: 100 },
      { product_id: 'b', pack_units: null, unit_price: 250, quantity: 1, product_price: 250 },
    ];

    expect(computeCartSubtotal(items)).toBe(550);
  });
});
