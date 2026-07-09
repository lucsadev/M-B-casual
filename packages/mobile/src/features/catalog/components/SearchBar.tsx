/**
 * SearchBar — Native search input with debounced onChange.
 *
 * Features:
 * - Search icon on the left
 * - Clear button when there's text
 * - 300ms debounce before calling onChange
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
      <View className="absolute left-3 z-10">
        <Text className="text-base text-[#1A1A1A]/40">🔍</Text>
      </View>

      <TextInput
        value={localValue}
        onChangeText={setLocalValue}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 h-10 pl-10 pr-8 rounded-lg border border-[#E8E4D9] bg-white text-sm text-[#1A1A1A]"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Clear button */}
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          className="absolute right-2 z-10 w-5 h-5 items-center justify-center"
          accessibilityLabel="Limpiar búsqueda"
          accessibilityRole="button"
        >
          <View className="w-4 h-4 rounded-full bg-[#1A1A1A]/30 items-center justify-center">
            <Text className="text-[10px] text-white font-bold">✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
