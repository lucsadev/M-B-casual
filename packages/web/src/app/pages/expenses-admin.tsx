/**
 * Admin Expenses Page
 *
 * Route: /admin/gastos
 * Displays operational expenses with category filtering,
 * and the ability to add new expenses.
 */
import { useState } from 'react';
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
} from '@/features/admin/finance/api/use-finance-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EXPENSE_CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'envío', label: 'Envío' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'varios', label: 'Varios' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

export function AdminExpensesPage() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    expenseCategory: 'varios',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useExpenses({ category: category || undefined, page, pageSize: 25 });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  async function handleCreate() {
    if (!form.description || !form.amount) return;
    await createExpense.mutateAsync({
      description: form.description,
      amount: Number(form.amount),
      category: form.expenseCategory,
      expense_date: form.expenseDate,
    });
    setShowCreate(false);
    setForm({
      description: '',
      amount: '',
      expenseCategory: 'varios',
      expenseDate: new Date().toISOString().split('T')[0],
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Gastos</h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Gastos operativos del negocio.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          + Nuevo gasto
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Select
          value={category || '__all__'}
          onValueChange={(value: string) => {
            setCategory(value === '__all__' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {EXPENSE_CATEGORIES.slice(1).map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="w-20">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data && data.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-[#1A1A1A]/50">
                  No hay gastos registrados.
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-sm text-[#1A1A1A]/60">
                  {new Date(expense.expense_date).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-[#F0F0EC] px-2.5 py-0.5 text-xs font-medium text-[#1A1A1A]">
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-red-500">
                  {formatPrice(expense.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteExpense.mutate(expense.id)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1A1A1A]/60">
            Página {data.page} de {data.totalPages} ({data.total} gastos)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="desc">Descripción</Label>
              <Input
                id="desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Insumos para packaging"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Monto ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="15000"
                />
              </div>
              <div>
                <Label htmlFor="expCat">Categoría</Label>
                <Select
                  value={form.expenseCategory}
                  onValueChange={(value: string) => setForm({ ...form, expenseCategory: value })}
                >
                  <SelectTrigger id="expCat">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.slice(1).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="expDate">Fecha</Label>
              <Input
                id="expDate"
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createExpense.isPending}>
              {createExpense.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
