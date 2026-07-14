/**
 * SearchBar — Native search input with debounced onChange.
 *
 * Features:
 * - Search icon on the left
 * - Clear button when there's text
 * - 300ms debounce before calling onChange
 * - Modern design with soft shadows and rounded corners
 * - Works with the mobile catalog's search flow
 */
import { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useDebounce } from '../../../hooks/use-debounce';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar productos...',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 300);
  const isFirstRender = useRef(true);

  // Sync external value changes (e.g., category change clears search)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Fire onChange only when debounced value changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  function handleClear() {
    setLocalValue('');
    onChange('');
  }

  return (
    <View className="relative flex-row items-center">
      {/* Search icon */}
      <View className="absolute left-4 z-10">
        <Text className="text-lg text-[#D4A853]">🔍</Text>
      </View>

      <TextInput
        value={localValue}
        onChangeText={setLocalValue}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 h-12 pl-12 pr-10 rounded-2xl border border-[#E8E4D9] bg-[#F9F9F7] text-sm font-medium text-[#1A1A1A] shadow-sm"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Clear button */}
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          className="absolute right-3 z-10 w-6 h-6 items-center justify-center"
          accessibilityLabel="Limpiar búsqueda"
          accessibilityRole="button"
        >
          <View className="w-5 h-5 rounded-full bg-[#D4A853] items-center justify-center shadow-md">
            <Text className="text-[10px] text-white font-bold">✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
