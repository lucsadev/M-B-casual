/**
 * SuppliersListPage — Admin supplier list with table, search, and actions.
 *
 * Displays all suppliers in a table with columns for:
 * name, contact, email, phone, status, created date.
 * Supports search by name and pagination.
 * Includes actions for editing and deleting suppliers.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteSupplier } from '../api/use-supplier-mutations';
import { CreateSupplierDialog } from '../components/CreateSupplierDialog';
import { EditSupplierDialog } from '../components/EditSupplierDialog';
import { SupplierDetailDialog } from '../components/SupplierDetailDialog';
import { buildPagination } from '@mbt/shared';
import type { Supplier } from '@mbt/shared';
import type { Database } from '@/lib/database.types';
import { Edit, Plus, Trash2 } from 'lucide-react';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchAdminSuppliers(
  search: string,
  page: number,
): Promise<{ suppliers: Supplier[]; total: number; page: number; totalPages: number }> {
  const pagination = buildPagination(page, PAGE_SIZE);
  let query = supabase
    .from('suppliers')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query
    .range(pagination.offset, pagination.offset + pagination.pageSize - 1)
    .order('name', { ascending: true });

  if (error) throw error;

  return {
    suppliers: (data ?? []).map(mapSupplier),
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SuppliersListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'suppliers', { search, page }],
    queryFn: () => fetchAdminSuppliers(search, page),
  });

  const deleteMutation = useDeleteSupplier();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
      setDeleteName('');
    } catch {
      // Error handled by mutation toast
    }
  }

  function openDeleteDialog(id: string, name: string) {
    setDeleteId(id);
    setDeleteName(name);
  }

  function openEditDialog(supplier: Supplier) {
    setEditSupplier(supplier);
  }

  function closeEditDialog() {
    setEditSupplier(null);
  }

  function openDetailDialog(supplier: Supplier) {
    setDetailSupplier(supplier);
  }

  function closeDetailDialog() {
    setDetailSupplier(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Proveedores</h1>
        <Button onClick={() => setSupplierDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo proveedor
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-[#E2E2DC]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data && data.suppliers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-[#1A1A1A]/50"
                >
                  {search
                    ? 'No se encontraron proveedores con ese nombre.'
                    : 'No hay proveedores todavía. ¡Creá el primero!'}
                </TableCell>
              </TableRow>
            )}

            {data?.suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
                onClick={() => openDetailDialog(supplier)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {supplier.contactName || '—'}
                </TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {supplier.email || '—'}
                </TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {supplier.phone || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={supplier.isActive ? 'success' : 'secondary'}>
                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(supplier.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(supplier);
                      }}
                      aria-label="Editar proveedor"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(supplier.id, supplier.name);
                      }}
                      aria-label="Eliminar proveedor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
            Página {data.page} de {data.totalPages} ({data.total} proveedores)
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setDeleteName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar{' '}
              <strong>{deleteName}</strong>? Esta acción es irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteId(null);
                setDeleteName('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit supplier dialog */}
      <EditSupplierDialog
        open={!!editSupplier}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
        initialSupplier={editSupplier}
      />

      {/* Supplier detail dialog */}
      <SupplierDetailDialog
        open={!!detailSupplier}
        onOpenChange={(open) => {
          if (!open) closeDetailDialog();
        }}
        supplier={detailSupplier}
      />

      {/* Create supplier dialog (main entry point) */}
      <CreateSupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
      />
    </div>
  );
}
