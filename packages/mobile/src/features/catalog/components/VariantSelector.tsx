/**
 * VariantSelector — Native size and color selector for product detail.
 *
 * Features:
 * - Size buttons in a horizontal row
 * - Color chips with the color name (text-only)
 * - Highlights selected variant
 * - Only shows variants with stock > 0
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  getAvailableSizes,
  getAvailableColors,
  resolveDefaultSelection,
  resolveNextSizeOnColorChange,
  resolveNextSizeOnSizeTap,
  type ProductVariant,
} from '@mbt/shared';

interface VariantSelectorProps {
  variants: ProductVariant[];
  onSizeChange: (size: string | null) => void;
  onColorChange: (color: string | null) => void;
}

export function VariantSelector({
  variants,
  onSizeChange,
  onColorChange,
}: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const sizes = getAvailableSizes(variants, selectedColor);
  const colors = getAvailableColors(variants);

  // Pre-select the default in-stock variant ONCE per mount via the shared
  // resolveDefaultSelection helper (first canonical-order size + that size's
  // color), mirroring the web product detail page, so a size chip is always
  // highlighted and Add always resolves to an explicit, confirmed variant
  // (never a blank selection with an enabled Add). Guarded by a mount-once
  // ref instead of the selection state, so it never re-fires after a
  // deliberate user change (a fresh mount happens on product change via
  // key={product.id} remount). didInit is set before propagating so the
  // parent mirror is only ever pushed by the first run. The parent mirror
  // stays in sync through onSizeChange/onColorChange.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    const { size, color } = resolveDefaultSelection(variants);
    if (size) {
      didInit.current = true;
      setSelectedSize(size);
      setSelectedColor(color);
      onSizeChange(size);
      onColorChange(color);
    }
  }, [variants, onSizeChange, onColorChange]);

  // Reactive repair on refetch/stock drops (web parity): if the currently
  // selected size is no longer in stock for the selected color — e.g. a
  // background refetch zeroed it — re-resolve a valid size via the shared
  // resolveNextSizeOnColorChange helper and propagate it through onSizeChange
  // so the parent mirror and the Add button stay in sync. It never fights an
  // in-flight user tap: both handlers already resolve to an in-stock size for
  // the selected color, so this only fires when the current size is NOT in
  // getAvailableSizes(variants, selectedColor). Self-terminating: a repaired
  // size is always in the color's in-stock set (or null when the color has no
  // stock left), so the guard short-circuits on the next run.
  useEffect(() => {
    if (!selectedColor) return;
    // Dead-color repair (web parity): a background refetch may zero ALL stock
    // of the currently selected color, leaving a highlighted chip for a color
    // that no longer renders. When that happens, re-resolve BOTH size and
    // color via the shared default selection and propagate both so the parent
    // mirror and the Add button stay in sync. Self-terminating: the
    // re-resolved color is in-stock by construction, so the includes-check
    // passes on the next run.
    if (!getAvailableColors(variants).includes(selectedColor)) {
      const { size, color } = resolveDefaultSelection(variants);
      if (size) {
        setSelectedSize(size);
        setSelectedColor(color);
        onSizeChange(size);
        onColorChange(color);
      }
      return;
    }
    const sizesForColor = getAvailableSizes(variants, selectedColor);
    if (selectedSize && sizesForColor.includes(selectedSize)) return;
    const nextSize = resolveNextSizeOnColorChange(
      variants,
      selectedSize,
      selectedColor,
    );
    if (nextSize !== selectedSize) {
      setSelectedSize(nextSize);
      onSizeChange(nextSize);
    }
  }, [variants, selectedColor, selectedSize, onSizeChange, onColorChange]);

  // No-toggle: tapping the already-selected size keeps it selected (web
  // parity — neither platform has a size deselect). Toggling it off would
  // leave a blank size with an enabled Add while a color stays selected.
  // Pure logic lives in resolveNextSizeOnSizeTap (tested in the web suite).
  function handleSizeSelect(size: string) {
    const next = resolveNextSizeOnSizeTap(
      variants,
      selectedSize,
      size,
      selectedColor,
    );
    if (next === null) return;
    setSelectedSize(next);
    onSizeChange(next);
  }

  // Color select with no-deselect (web parity): tapping the already-selected
  // color keeps it selected — `next` is always the tapped color, never null,
  // matching web's `setSelectedColor(color)` which bails on the same value.
  // Auto-size behavior is delegated to the shared
  // resolveNextSizeOnColorChange: the current size is kept when it is still
  // in stock in the tapped color, otherwise the first in-stock size of that
  // color is selected. With no-deselect the resolver's null branch is
  // unreachable from the UI (kept as a defensive guard for robustness).
  function handleColorSelect(color: string) {
    const next = color;
    setSelectedColor(next);
    onColorChange(next);
    const nextSize = resolveNextSizeOnColorChange(variants, selectedSize, next);
    setSelectedSize(nextSize);
    onSizeChange(nextSize);
  }

  if (sizes.length === 0 && colors.length === 0) {
    return null;
  }

  return (
    <View className="gap-4">
      {/* Size selector */}
      {sizes.length > 0 && (
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Talle
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {sizes.map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => handleSizeSelect(size)}
                className={`min-w-[3rem] px-3 py-1.5 rounded-md border ${
                  selectedSize === size
                    ? 'bg-[#D4A853] border-[#D4A853]'
                    : 'bg-white border-[#E8E4D9]'
                }`}
              >
                <Text
                  className={`text-sm font-medium text-center ${
                    selectedSize === size ? 'text-white' : 'text-[#1A1A1A]'
                  }`}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Color selector */}
      {colors.length > 0 && (
        <View>
          <Text className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-2">
            Color
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => handleColorSelect(color)}
                className={`flex-row items-center gap-2 px-3 py-1.5 rounded-md border ${
                  selectedColor === color
                    ? 'bg-[#D4A853]/10 border-[#D4A853]'
                    : 'bg-white border-[#E8E4D9]'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedColor === color
                      ? 'text-[#D4A853]'
                      : 'text-[#1A1A1A]'
                  }`}
                >
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
