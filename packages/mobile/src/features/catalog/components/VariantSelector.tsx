/**
 * VariantSelector — Native size and color selector for product detail.
 *
 * Features:
 * - Size buttons in a horizontal row
 * - Color swatches with hex preview circles
 * - Highlights selected variant
 * - Only shows variants with stock > 0
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { ProductVariant } from '@mbt/shared';

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

  const variantsInStock = variants.filter((v) => v.stock > 0);
  const sizes = [...new Set(variantsInStock.map((v) => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(variantsInStock.map((v) => v.color).filter(Boolean))] as string[];
  const colorHexMap = new Map(
    variantsInStock
      .filter((v) => v.color && v.colorHex)
      .map((v) => [v.color!, v.colorHex!]),
  );

  function handleSizeSelect(size: string) {
    const next = selectedSize === size ? null : size;
    setSelectedSize(next);
    onSizeChange(next);
  }

  function handleColorSelect(color: string) {
    const next = selectedColor === color ? null : color;
    setSelectedColor(next);
    onColorChange(next);
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
            {colors.map((color) => {
              const hex = colorHexMap.get(color);
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => handleColorSelect(color)}
                  className={`flex-row items-center gap-2 px-3 py-1.5 rounded-md border ${
                    selectedColor === color
                      ? 'bg-[#D4A853]/10 border-[#D4A853]'
                      : 'bg-white border-[#E8E4D9]'
                  }`}
                >
                  {hex && (
                    <View
                      className="w-4 h-4 rounded-full border border-[#E8E4D9]"
                      style={{ backgroundColor: hex }}
                    />
                  )}
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
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
