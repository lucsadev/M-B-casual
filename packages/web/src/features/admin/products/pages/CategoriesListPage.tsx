/**
 * CategoriesListPage — Admin category list with table, search, and actions.
 *
 * Displays all categories in a table with columns for:
 * name, slug, description, image, sort order, created date.
 * Supports search by name and pagination.
 * Includes actions for editing and deleting categories.
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
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteCategory } from '../api/use-category-mutations';
import { CreateCategoryDialog } from '../components/CreateCategoryDialog';
import { EditCategoryDialog } from '../components/EditCategoryDialog';
import { buildPagination } from '@mbt/shared';
import type { Category } from '@mbt/shared';
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

type CategoryRow = Database['public']['Tables']['categories']['Row'];

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoriesListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories', { search, page }],
    queryFn: () => fetchAdminCategories(search, page),
  });

  const deleteMutation = useDeleteCategory();

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

  function openEditDialog(category: Category) {
    setEditCategory(category);
  }

  function closeEditDialog() {
    setEditCategory(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Categorías</h1>
        <Button onClick={() => setCategoryDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
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
              <TableHead className="w-16">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Descripción</TableHead>
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

            {!isLoading && data && data.categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-[#1A1A1A]/50"
                >
                  {search
                    ? 'No se encontraron categorías con ese nombre.'
                    : 'No hay categorías todavía. ¡Creá la primera!'}
                </TableCell>
              </TableRow>
            )}

            {data?.categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  {category.imageUrl ? (
                    <OptimizedImage
                      src={`${category.imageUrl}?width=80`}
                      alt={category.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E2E2DC] text-xs text-[#1A1A1A]/40">
                      -
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {category.slug}
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell className="max-w-xs truncate text-[#1A1A1A]/60">
                  {category.description || '—'}
                </TableCell>
                <TableCell>{formatDate(category.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                      aria-label="Editar categoría"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => openDeleteDialog(category.id, category.name)}
                      aria-label="Eliminar categoría"
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
            Página {data.page} de {data.totalPages} ({data.total} categorías)
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
            <DialogTitle>Eliminar categoría</DialogTitle>
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

      {/* Edit category dialog */}
      <EditCategoryDialog
        open={!!editCategory}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
        initialCategory={editCategory}
      />

      {/* Create category dialog (main entry point) */}
      <CreateCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
      />
    </div>
  );
}

async function fetchAdminCategories(
  search: string,
  page: number,
): Promise<{ categories: Category[]; total: number; page: number; totalPages: number }> {
  const pagination = buildPagination(page, PAGE_SIZE);
  let query = supabase
    .from('categories')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: categories, error, count } = await query
    .range(pagination.offset, pagination.offset + pagination.pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    categories: (categories ?? []).map(mapCategory),
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}