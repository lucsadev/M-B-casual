/**
 * ProductListPage — Admin product list with table, search, and actions.
 *
 * Displays all products in a table with columns for:
 * thumbnail, name, category, price, total stock, status.
 * Supports search by name and pagination.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useDeleteProduct } from '../api/use-product-mutations';
import { buildPagination } from '@mbt/shared';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Admin product row (mutated with joined variant data)
// ---------------------------------------------------------------------------

interface AdminProductRow extends ProductRow {
  total_stock: number;
}

// ---------------------------------------------------------------------------
// Admin query — gets ALL products including inactive
// ---------------------------------------------------------------------------

async function fetchAdminProducts(
  search: string,
  page: number,
): Promise<{ products: AdminProductRow[]; total: number; page: number; totalPages: number }> {
  const pagination = buildPagination(page, PAGE_SIZE);
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data: products, error, count } = await query;

  if (error) throw error;

  // Fetch stock totals for each product
  const productIds = (products ?? []).map((p: ProductRow) => p.id);
  let stockMap: Record<string, number> = {};

  if (productIds.length > 0) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('product_id, stock')
      .in('product_id', productIds);

    stockMap = (variants ?? []).reduce<Record<string, number>>((acc, v: any) => {
      acc[v.product_id] = (acc[v.product_id] ?? 0) + (v.stock ?? 0);
      return acc;
    }, {});
  }

  const enrichedProducts: AdminProductRow[] = (products ?? []).map((p: ProductRow) => ({
    ...p,
    total_stock: stockMap[p.id] ?? 0,
  }));

  return {
    products: enrichedProducts,
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', { search, page }],
    queryFn: () => fetchAdminProducts(search, page),
  });

  const deleteMutation = useDeleteProduct();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId, hard: false });
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Productos</h1>
        <Link to="/admin/productos/nuevo">
          <Button>+ Nuevo producto</Button>
        </Link>
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
      <div className="rounded-md border border-[#E8E4D9]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Img</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
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

            {!isLoading && data && data.products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-[#1A1A1A]/50"
                >
                  {search
                    ? 'No se encontraron productos con ese nombre.'
                    : 'No hay productos todavía. ¡Creá el primero!'}
                </TableCell>
              </TableRow>
            )}

            {data?.products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.images?.[0] ? (
                    <img
                      src={`${product.images[0]}?width=80&format=webp`}
                      alt={product.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E8E4D9] text-xs text-[#1A1A1A]/40">
                      -
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-[#1A1A1A]/60">
                  {product.category_id?.slice(0, 8)}...
                </TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>{product.total_stock}</TableCell>
                <TableCell>
                  <Badge
                    variant={product.is_active ? 'success' : 'secondary'}
                  >
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/admin/productos/${product.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() =>
                        openDeleteDialog(product.id, product.name)
                      }
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

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1A1A1A]/60">
            Página {data.page} de {data.totalPages} ({data.total} productos)
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
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar{' '}
              <strong>{deleteName}</strong>? Esta acción es reversible —
              el producto se desactivará pero los datos se conservan.
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
    </div>
  );
}
