/**
 * Pack price splitting utilities.
 *
 * When a product is sold as a pack (products.pack_units != NULL), the published
 * price covers ALL N variant units. We split this total into per-row amounts
 * (integer cents) whose sum equals the pack price EXACTLY.
 *
 * Algorithm (mirrors the authoritative create_order_from_cart RPC):
 * 1. Compute discounted base in integer cents: `baseCents = round(total * 100 * (1 - discount/100))`
 * 2. Per-unit cents: `perUnitCents = floor(baseCents / packUnits)`
 * 3. Subtotal for this row: `perUnitCents * quantity`
 * 4. LAST row of the pack group absorbs the remainder: `baseCents % packUnits`
 *
 * This guarantees: sum of all row subtotals == discounted pack total (integer cents).
 */

export interface SplitPackPriceInput {
  /** products.price — total pack price in ARS (not cents) */
  total: number;
  /** products.pack_units (2 | 3 in v1) */
  packUnits: number;
  /** Row quantity (collapsed repeats); default 1 */
  quantity?: number;
  /** Variant discount % applied to the split base; default 0 */
  discount?: number;
  /** 1-based position of this cart row within the pack group */
  rowIndex: number;
  /** Total cart rows composing the group */
  rowCount: number;
}

export interface SplitPackPriceResult {
  /** Per-unit price in ARS (derived from floor cents, may differ from subtotal/qty by ≤ 1 cent) */
  unitPrice: number;
  /** Row subtotal in ARS: unitPrice * quantity + remainder when this is the last row */
  subtotal: number;
}

/**
 * Split a pack total into a per-row unit price and subtotal.
 *
 * `unitPrice` is the display-friendly per-unit price derived from the integer
 * floor, and `subtotal` is the row's exact contribution to the pack total.
 * For the last row of the group, `subtotal` absorbs the cents remainder so
 * the group sum matches `products.price` exactly.
 *
 * @throws If packUnits < 2
 */
export function splitPackPrice(input: SplitPackPriceInput): SplitPackPriceResult {
  const { packUnits, rowIndex, rowCount } = input;
  const quantity = input.quantity ?? 1;
  const discount = input.discount ?? 0;

  if (packUnits < 2) {
    throw new Error(`packUnits must be >= 2, got ${packUnits}`);
  }

  // Integer-cents computation (mirrors RPC)
  const totalCents = Math.round(input.total * 100);
  const discountedCents = Math.round(totalCents * (1 - discount / 100));
  const perUnitCents = Math.floor(discountedCents / packUnits);

  const isLastRow = rowIndex === rowCount;
  const remainder = isLastRow ? discountedCents % packUnits : 0;

  const subtotalCents = perUnitCents * quantity + remainder;

  return {
    unitPrice: perUnitCents / 100,
    subtotal: subtotalCents / 100,
  };
}
