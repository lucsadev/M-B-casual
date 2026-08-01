/**
 * Select — modal-based dropdown selector for mobile.
 *
 * Shows a TouchableOpacity with the selected value.
 * On press, opens a Modal with a scrollable list of options.
 */
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  label,
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption?.label ?? placeholder;
  const hasValue = !!selectedOption;

  return (
    <View>
      {label && (
        <Text className="text-xs font-medium text-[#1A1A1A]/60 mb-1">
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-[#E2E2DC] rounded-lg px-3 py-2.5 flex-row items-center justify-between"
      >
        <Text
          className={`text-sm flex-1 ${hasValue ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Text className="text-sm text-[#1A1A1A]/30 ml-2">▼</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center px-4"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white rounded-2xl max-h-[60%]"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 pt-5 pb-3 border-b border-[#E2E2DC]">
              <Text className="text-base font-bold text-[#1A1A1A]">
                {label ?? 'Seleccionar'}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text className="text-lg text-[#1A1A1A]/40">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView className="px-2 py-2">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex-row items-center justify-between px-3 py-3.5 rounded-xl mb-0.5 ${
                      isSelected ? 'bg-[#1A1A1A]' : ''
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-[#1A1A1A]/80'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Text className="text-white text-sm font-bold">✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
