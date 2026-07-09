/**
 * ExpensesPage — CRUD for operational expenses at /admin/gastos.
 *
 * Features:
 * - Date range + category filters
 * - Table: date, category, description, amount, actions
 * - Create / Edit via dialog modal with client-side validation
 * - Delete with confirmation
 */
import { useState } from 'react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '../hooks/use-finance';
import { DateRangeFilter } from '../components/date-range-filter';
import type { DateRange } from '../components/date-range-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Expense, ExpenseCategory } from '@mbt/shared';
import type { CreateExpenseInput, UpdateExpenseInput } from '../api/queries';

// ---------------------------------------------------------------------------
// Constants — MUST match shared ExpenseCategory type
// ---------------------------------------------------------------------------

const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'Todas las categorías' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'logistica', label: 'Logística' },
  { value: 'otros', label: 'Otros' },
];

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== '');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR');
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

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

interface FormErrors {
  description?: string;
  amount?: string;
}

function validateForm(form: ExpenseForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.description.trim()) {
    errors.description = 'La descripción es obligatoria';
  }
  const amount = Number(form.amount);
  if (!form.amount || amount <= 0) {
    errors.amount = 'El monto debe ser mayor a 0';
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function ExpensesPage() {
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return { from, to: todayISO() };
  });
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch
  const { data: expenses, isLoading, isError } = useExpenses({
    fechaDesde: dateRange.from,
    fechaHasta: dateRange.to,
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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

  function openEdit(expense: Expense) {
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

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  async function handleSave() {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const input: CreateExpenseInput = {
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category as ExpenseCategory,
      expenseDate: form.expenseDate,
    };

    try {
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, data: input as UpdateExpenseInput });
      } else {
        await createExpense.mutateAsync(input);
      }
      closeDialog();
    } catch {
      // Toast handled by hook
    }
  }

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  function confirmDelete(expense: Expense) {
    setDeletingId(expense.id);
    setDeletingDescription(expense.description);
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteExpense.mutateAsync(deletingId);
    } catch {
      // Toast handled by hook
    } finally {
      setDeletingId(null);
      setDeletingDescription('');
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] lg:text-3xl">
            Gestión de Gastos
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Gastos operativos del negocio.
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo gasto</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="w-full lg:w-48">
          <Label className="mb-1 block text-xs font-medium text-[#1A1A1A]/60">
            Categoría
          </Label>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={EXPENSE_CATEGORIES}
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error al cargar los gastos. Intentalo de nuevo.
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading */}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Empty */}
            {!isLoading && (!expenses || expenses.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-[#1A1A1A]/50">
                  {categoryFilter
                    ? 'No hay gastos con los filtros seleccionados.'
                    : 'No hay gastos registrados.'}
                </TableCell>
              </TableRow>
            )}

            {/* Rows */}
            {expenses?.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {formatDate(expense.expenseDate)}
                </TableCell>
                <TableCell className="font-medium text-[#1A1A1A]">
                  {expense.description}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-[#F0F0EC] px-2.5 py-0.5 text-xs font-medium text-[#1A1A1A]">
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-red-500">
                  {formatPrice(expense.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(expense)}
                      className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(expense)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ================================================================== */}
      {/* CREATE / EDIT DIALOG */}
      {/* ================================================================== */}
      <Dialog open={dialogOpen} onOpenChange={(open: boolean) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar gasto' : 'Nuevo gasto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Description */}
            <div>
              <Label htmlFor="exp-desc">Descripción</Label>
              <Input
                id="exp-desc"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Alquiler local"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>
              )}
            </div>

            {/* Amount + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-amount">Monto ($)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min={0}
                  step={1}
                  value={form.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, amount: e.target.value })}
                  placeholder="15000"
                />
                {formErrors.amount && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.amount}</p>
                )}
              </div>
              <div>
                <Label htmlFor="exp-category">Categoría</Label>
                <Select
                  id="exp-category"
                  value={form.category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value })}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="exp-date">Fecha</Label>
              <Input
                id="exp-date"
                type="date"
                value={form.expenseDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, expenseDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createExpense.isPending || updateExpense.isPending}
            >
              {createExpense.isPending || updateExpense.isPending
                ? 'Guardando...'
                : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ================================================================== */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar gasto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#1A1A1A]/70">
            ¿Estás seguro de eliminar el gasto{' '}
            <strong className="text-[#1A1A1A]">{deletingDescription}</strong>?
            <br />
            Esta acción también eliminará el movimiento de caja asociado.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteExpense.isPending}
            >
              {deleteExpense.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
