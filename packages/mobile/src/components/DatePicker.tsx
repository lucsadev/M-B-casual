/**
 * DatePicker — cross-platform date picker for mobile.
 *
 * Uses @react-native-community/datetimepicker.
 * - iOS: opens a modal with the inline wheel picker.
 * - Android: triggers the native dialog on press.
 */
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
}: DatePickerProps) {
  const [show, setShow] = useState(false);

  const currentDate = value ? parseISODate(value) : new Date();

  function handleChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate) {
      onChange(formatDateString(selectedDate));
    }
  }

  function handleConfirm() {
    setShow(false);
    // On iOS the date is already updated via onChange from the picker
  }

  return (
    <View>
      {label && (
        <Text className="text-xs font-medium text-[#1A1A1A]/60 mb-1">
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setShow(true)}
        className="border border-[#E2E2DC] rounded-lg px-3 py-2.5"
      >
        <Text
          className={`text-sm ${value ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}
        >
          {value ? formatDisplay(currentDate) : placeholder}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={show}
          transparent
          animationType="fade"
          onRequestClose={() => setShow(false)}
          statusBarTranslucent
        >
          <TouchableOpacity
            className="flex-1 bg-black/40 justify-end"
            activeOpacity={1}
            onPress={() => setShow(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              className="bg-white rounded-t-2xl px-4 pt-4 pb-8"
            >
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-sm text-red-400">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text className="text-sm font-bold text-[#1A1A1A]">Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                locale="es-AR"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : show ? (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
