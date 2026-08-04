/**
 * SupplierDetailDialog — read-only modal showing a supplier's details and the
 * list of associated products.
 *
 * Uses useSupplierProducts to fetch products linked to the supplier. Shows a
 * skeleton while loading and an empty state when the supplier has no products.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupplierProducts } from '../api/use-supplier-queries';
import type { Supplier } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SupplierDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SupplierDetailDialog({
  open,
  onOpenChange,
  supplier,
}: SupplierDetailDialogProps) {
  const { data: products, isLoading } = useSupplierProducts(supplier?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier?.name ?? 'Detalle del proveedor'}</DialogTitle>
          <DialogDescription>
            Detalles del proveedor y sus productos asociados.
          </DialogDescription>
        </DialogHeader>

        {supplier && (
          <div className="space-y-4">
            {/* Supplier details */}
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-[#1A1A1A]/50">Contacto</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {supplier.contactName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#1A1A1A]/50">Email</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {supplier.email || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#1A1A1A]/50">Teléfono</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {supplier.phone || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#1A1A1A]/50">Dirección</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {supplier.address || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#1A1A1A]/50">Estado</dt>
                <dd>
                  <Badge
                    variant={supplier.isActive ? 'success' : 'secondary'}
                  >
                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#1A1A1A]/50">Creado</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {formatDate(supplier.createdAt)}
                </dd>
              </div>
            </dl>

            {/* Associated products */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[#1A1A1A]">
                Productos asociados
              </h4>

              {isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              )}

              {!isLoading && products && products.length === 0 && (
                <p className="text-sm text-[#1A1A1A]/60">
                  Este proveedor no tiene productos asociados.
                </p>
              )}

              {!isLoading && products && products.length > 0 && (
                <ul className="divide-y divide-[#E2E2DC] rounded-md border border-[#E2E2DC]">
                  {products.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="font-medium text-[#1A1A1A]">
                        {product.name}
                      </span>
                      <span className="flex items-center gap-3 text-right">
                        <span className="text-sm text-[#1A1A1A]/60">
                          ${product.price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-[#1A1A1A]/40">
                          Costo:{' '}
                          {product.cost != null
                            ? `$${product.cost.toLocaleString('es-AR')}`
                            : '—'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}