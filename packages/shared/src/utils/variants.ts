import type { ProductVariant } from '../types/product.ts';

/**
 * Canonical size ordering used across catalog UI.
 * Unknown sizes sort before 'S' (indexOf returns -1), matching previous behavior.
 */
const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', 'Único', 'unico'];

/**
 * Return the variants that currently have stock (stock > 0).
 *
 * @param variants - All product variants (may include stock = 0 rows)
 * @returns Variants with stock > 0
 */
export function getInStockVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.filter((v) => v.stock > 0);
}

/**
 * Unique sizes available with stock, optionally scoped to a single color.
 * When no color is selected, sizes are computed across all in-stock variants.
 *
 * @param variants - All product variants
 * @param selectedColor - Color name to scope sizes to (optional)
 * @returns Sorted unique size labels (S/M/L/XL/XXL/Único order)
 */
export function getAvailableSizes(
  variants: ProductVariant[],
  selectedColor?: string | null,
): string[] {
  const inStock = getInStockVariants(variants);
  const scoped = selectedColor
    ? inStock.filter((v) => v.color === selectedColor)
    : inStock;
  const sizes = [...new Set(scoped.map((v) => v.size).filter(Boolean))] as string[];
  return sizes.sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}

/**
 * Unique colors that have at least one in-stock variant.
 *
 * @param variants - All product variants
 * @returns Unique color names with any stock
 */
export function getAvailableColors(variants: ProductVariant[]): string[] {
  const inStock = getInStockVariants(variants);
  return [...new Set(inStock.map((v) => v.color).filter(Boolean))] as string[];
}

/**
 * First size with stock > 0 for the given color, or across all colors when
 * no color is given. Honors the canonical S/M/L/XL/XXL/Único order used by
 * `getAvailableSizes`.
 *
 * @param variants - All product variants
 * @param color - Color name to scope sizes to (optional)
 * @returns First in-stock size label, or null when no in-stock size exists
 */
export function getFirstInStockSize(
  variants: ProductVariant[],
  color?: string | null,
): string | null {
  const sizes = getAvailableSizes(variants, color);
  return sizes[0] ?? null;
}

/**
 * Resolve the variant id matching the selected size and/or color, requiring
 * stock. When neither size nor color is selected, resolves to null — never to
 * an implicit variant the user did not pick (a blank selection must not enable
 * Add with a silently chosen variant). The resolved combo is never a
 * stock = 0 variant.
 *
 * @param variants - All product variants
 * @param selectedSize - Selected size label (optional)
 * @param selectedColor - Selected color name (optional)
 * @returns Matching in-stock variant id, or null when nothing matches
 */
export function resolveInStockVariantId(
  variants: ProductVariant[],
  selectedSize?: string | null,
  selectedColor?: string | null,
): string | null {
  if (!selectedSize && !selectedColor) {
    return null;
  }
  const inStock = getInStockVariants(variants);
  return (
    inStock.find((v) => {
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const colorMatch = !selectedColor || v.color === selectedColor;
      return sizeMatch && colorMatch;
    })?.id ?? null
  );
}

/**
 * Deterministic default selection shared by web and mobile so both platforms
 * start with the same highlighted chips regardless of variant array order:
 * the first canonical-order in-stock size (via `getFirstInStockSize`), plus
 * the color of the first in-stock variant of that size that has a color
 * (falling back to the first in-stock variant of that size, whose color may
 * be undefined).
 *
 * @param variants - All product variants
 * @returns The default { size, color }, or { size: null, color: null } when
 *          no variant has stock
 */
export function resolveDefaultSelection(
  variants: ProductVariant[],
): { size: string | null; color: string | null } {
  const size = getFirstInStockSize(variants);
  if (!size) return { size: null, color: null };
  const sizeVariants = getInStockVariants(variants).filter(
    (v) => v.size === size,
  );
  const color =
    sizeVariants.find((v) => v.color)?.color ?? sizeVariants[0]?.color ?? null;
  return { size, color };
}

/**
 * Next size after a color change. Keeps the current size when it is still in
 * stock in the next color, otherwise auto-selects the first in-stock size of
 * that color (canonical order). Deselecting a color (null/empty nextColor)
 * forces an explicit re-pick: returns null so the caller clears the size
 * selection too, instead of silently resolving to a variant of a color the
 * user never picked.
 *
 * @param variants - All product variants
 * @param currentSize - Currently selected size (optional)
 * @param nextColor - Color being selected, or null/undefined when deselected
 * @returns Size to select, or null when nothing should stay selected
 */
export function resolveNextSizeOnColorChange(
  variants: ProductVariant[],
  currentSize: string | null | undefined,
  nextColor: string | null | undefined,
): string | null {
  if (!nextColor) return null;
  const sizesForColor = getAvailableSizes(variants, nextColor);
  if (currentSize && sizesForColor.includes(currentSize)) return currentSize;
  return getFirstInStockSize(variants, nextColor);
}

/**
 * Next size after a size chip tap. Tapping the already-selected size keeps it
 * (no-toggle — web and mobile have no size deselect), so returns null; tapping
 * any other size selects it. `_variants` and `_selectedColor` are reserved for
 * future stock-aware validation and mirror the other resolvers; current
 * consumers only rely on the toggle semantics.
 *
 * @param _variants - All product variants (reserved for future use)
 * @param currentSize - Currently selected size (optional)
 * @param tappedSize - Size label the user tapped
 * @param _selectedColor - Currently selected color (optional, reserved)
 * @returns The tapped size, or null when it is already selected (no-op)
 */
export function resolveNextSizeOnSizeTap(
  _variants: ProductVariant[],
  currentSize: string | null | undefined,
  tappedSize: string,
  _selectedColor: string | null | undefined,
): string | null {
  return currentSize === tappedSize ? null : tappedSize;
}
