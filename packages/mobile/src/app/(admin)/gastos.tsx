/**
 * Gestión de Gastos — /admin/gastos
 *
 * Ported from web's features/finance/pages/expenses-page.tsx
 * Uses new finance feature hooks with camelCase types.
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DatePicker from '../../components/DatePicker';
import Select from '../../components/Select';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '../../features/finance/hooks/use-finance';
import type { ExpenseCategory } from '@mbt/shared';

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-AR');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR');
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'logistica', label: 'Logística' },
  { value: 'otros', label: 'Otros' },
];

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== '');

interface ExpenseForm {
  description: string;
  amount: string;
  category: string;
  expenseDate: string;
}

const EMPTY_FORM: ExpenseForm = {
  description: '',
  amount: '',
  category: 'otros',
  expenseDate: todayISO(),
};

export default function AdminExpensesScreen() {
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch
  const { data: expenses, isLoading, isError } = useExpenses({
    categoria: (categoryFilter as ExpenseCategory) || undefined,
  });

  // Mutations
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{ description?: string; amount?: string }>({});

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingDescription, setDeletingDescription] = useState('');

  // ---------------------------------------------------------------------------
  // Dialog handlers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(expense: { id: string; description: string; amount: number; category: string; expenseDate: string }) {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      expenseDate: expense.expenseDate,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: { description?: string; amount?: string } = {};
    if (!form.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    }
    const amount = Number(form.amount);
    if (!form.amount || amount <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;

    try {
      if (editingId) {
        await updateExpense.mutateAsync({
          id: editingId,
          data: {
            description: form.description.trim(),
            amount: Number(form.amount),
            category: form.category as ExpenseCategory,
            expenseDate: form.expenseDate,
          },
        });
      } else {
        await createExpense.mutateAsync({
          description: form.description.trim(),
          amount: Number(form.amount),
          category: form.category as ExpenseCategory,
          expenseDate: form.expenseDate,
        });
      }
      closeDialog();
    } catch {
      // Alert handled by hook
    }
  }

  function confirmDelete(expense: { id: string; description: string }) {
    setDeletingId(expense.id);
    setDeletingDescription(expense.description);
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteExpense.mutateAsync(deletingId);
    } catch {
      // Alert handled by hook
    } finally {
      setDeletingId(null);
      setDeletingDescription('');
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      {/* Header */}
      <View className="px-4 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-[#1A1A1A]">Gestión de Gastos</Text>
          <Text className="mt-1 text-sm text-[#1A1A1A]/60">
            Gastos operativos del negocio.
          </Text>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          className="bg-[#1A1A1A] px-4 py-2.5 rounded-lg"
        >
          <Text className="text-sm font-medium text-white">+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <View className="px-4 mb-4">
        <Select
          label="Categoría"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={EXPENSE_CATEGORIES}
          placeholder="Todas"
        />
      </View>

      {/* Error state */}
      {isError && (
        <View className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-700">Error al cargar los gastos.</Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View className="px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-16 rounded-md bg-[#F0F0EC]" />
          ))}
        </View>
      )}

      {/* Empty */}
      {!isLoading && (!expenses || expenses.length === 0) && (
        <View className="mx-4 items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <Text className="text-sm text-[#1A1A1A]/50">
            {categoryFilter
              ? 'No hay gastos con el filtro seleccionado.'
              : 'No hay gastos registrados.'}
          </Text>
        </View>
      )}

      {/* Expense list */}
      {!isLoading && expenses && expenses.length > 0 && (
        <View className="px-4 gap-2">
          {expenses.map((expense) => (
            <View key={expense.id} className="rounded-lg border border-[#E2E2DC] bg-white p-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-medium text-[#1A1A1A]">
                    {expense.description}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="bg-[#F0F0EC] px-2 py-0.5 rounded-full">
                      <Text className="text-xs text-[#1A1A1A]/70">
                        {expense.category}
                      </Text>
                    </View>
                    <Text className="text-xs text-[#1A1A1A]/40">
                      {formatDate(expense.expenseDate)}
                    </Text>
                  </View>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-sm font-bold text-red-500">
                    {formatPrice(expense.amount)}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => openEdit(expense)}>
                      <Text className="text-xs text-[#1A1A1A]/50">Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(expense)}>
                      <Text className="text-xs text-red-400">Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ================================================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ================================================================== */}
      <Modal
        visible={dialogOpen}
        transparent
        animationType="none"
        onRequestClose={closeDialog}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/40 justify-center px-4">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-white rounded-2xl p-6 max-h-[80%]">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-[#1A1A1A]">
                  {editingId ? 'Editar gasto' : 'Nuevo gasto'}
                </Text>
                <TouchableOpacity onPress={closeDialog}>
                  <Text className="text-lg text-[#1A1A1A]/40">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="gap-4">
                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-[#1A1A1A]/80 mb-1">Descripción</Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(text) => setForm({ ...form, description: text })}
                    placeholder="Ej: Alquiler local"
                    className="border border-[#E2E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A]"
                    placeholderTextColor="#9CA3AF"
                  />
                  {formErrors.description && (
                    <Text className="mt-1 text-xs text-red-500">{formErrors.description}</Text>
                  )}
                </View>

                {/* Amount + Category */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#1A1A1A]/80 mb-1">Monto ($)</Text>
                    <TextInput
                      value={form.amount}
                      onChangeText={(text) => setForm({ ...form, amount: text })}
                      keyboardType="numeric"
                      placeholder="15000"
                      className="border border-[#E2E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A]"
                      placeholderTextColor="#9CA3AF"
                    />
                    {formErrors.amount && (
                      <Text className="mt-1 text-xs text-red-500">{formErrors.amount}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Select
                      label="Categoría"
                      value={form.category}
                      onChange={(val) => setForm({ ...form, category: val })}
                      options={CATEGORY_OPTIONS}
                      placeholder="Seleccionar"
                    />
                  </View>
                </View>

                {/* Date */}
                <DatePicker
                  label="Fecha"
                  value={form.expenseDate}
                  onChange={(date) => setForm({ ...form, expenseDate: date })}
                />
              </ScrollView>

              {/* Actions */}
              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={closeDialog}
                  className="flex-1 border border-[#E2E2DC] rounded-lg py-2.5 items-center"
                >
                  <Text className="text-sm font-medium text-[#1A1A1A]/70">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={createExpense.isPending || updateExpense.isPending}
                  className="flex-1 bg-[#1A1A1A] rounded-lg py-2.5 items-center"
                >
                  {createExpense.isPending || updateExpense.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-sm font-medium text-white">Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ================================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================================== */}
      <Modal
        visible={!!deletingId}
        transparent
        animationType="none"
        onRequestClose={() => setDeletingId(null)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/40 justify-center px-4">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-[#1A1A1A] mb-2">Eliminar gasto</Text>
            <Text className="text-sm text-[#1A1A1A]/70 mb-6">
              ¿Estás seguro de eliminar el gasto{' '}
              <Text className="font-bold text-[#1A1A1A]">{deletingDescription}</Text>?
              {'\n'}Esta acción también eliminará el movimiento de caja asociado.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeletingId(null)}
                className="flex-1 border border-[#E2E2DC] rounded-lg py-2.5 items-center"
              >
                <Text className="text-sm font-medium text-[#1A1A1A]/70">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleteExpense.isPending}
                className="flex-1 bg-red-500 rounded-lg py-2.5 items-center"
              >
                {deleteExpense.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-medium text-white">Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
