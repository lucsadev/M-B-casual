/**
 * ProductGrid — Responsive product grid with infinite scroll.
 *
 * Features:
 * - 1 column mobile, 2 tablet, 3-4 desktop
 * - Uses useProducts hook with infinite query
 * - Intersection Observer for infinite scroll ("Cargar más" fallback button)
 * - Loading skeleton while fetching
 * - Empty state when no results match filters
 * - Error state with retry message
 * - Modern design with improved spacing and visual hierarchy
 */
import { useRef, useCallback, useEffect } from 'react';
import type { CatalogFilters } from '@mbt/shared';
import { useProducts } from '../hooks/use-products';
import { ProductCard } from './product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  category: string;
  search: string;
}

export function ProductGrid({ category, search }: ProductGridProps) {
  const filters: Omit<CatalogFilters, 'page'> = {
    category: category || undefined,
    search: search || undefined,
    pageSize: 12,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useProducts(filters);

  const products = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state — show skeleton grid
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#E2E2DC]/50 bg-white shadow-sm">
            <Skeleton className="aspect-[3/4] w-full rounded-none bg-[#F0F0EC]" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4 bg-[#F0F0EC]" />
              <Skeleton className="h-7 w-1/3 bg-[#F0F0EC]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E2E2DC]/50 bg-white py-16 text-center shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-14 w-14 text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3 className="text-lg font-semibold text-[#1A1A1A]">
          Error al cargar productos
        </h3>
        <p className="max-w-md text-sm text-[#1A1A1A]/60">
          {error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado. Intentalo de nuevo.'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E2E2DC]/50 bg-white py-16 text-center shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-14 w-14 text-[#1A1A1A]/30"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <h3 className="text-lg font-semibold text-[#1A1A1A]">
          No encontramos productos
        </h3>
        <p className="max-w-md text-sm text-[#1A1A1A]/60">
          {search
            ? `No hay resultados para "${search}". Probá con otros términos.`
            : 'No hay productos en esta categoría. Probá con otro filtro.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results count */}
      <p className="mb-6 text-sm font-medium text-[#1A1A1A]/50">
        {totalCount} {totalCount === 1 ? 'producto encontrado' : 'productos encontrados'}
        {search && <> para &ldquo;{search}&rdquo;</>}
      </p>

      {/* Product grid */}
      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          'sm:grid-cols-2',
          'lg:grid-cols-3',
          'xl:grid-cols-4',
        )}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Fallback "Cargar más" button (shown when observer fails) */}
      {hasNextPage && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="rounded-full px-8 py-6 text-sm font-semibold shadow-sm hover:shadow-md"
          >
            {isFetchingNextPage ? 'Cargando...' : 'Cargar más productos'}
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#E2E2DC]/50 bg-white shadow-sm">
              <Skeleton className="aspect-[3/4] w-full rounded-none bg-[#F0F0EC]" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4 bg-[#F0F0EC]" />
                <Skeleton className="h-7 w-1/3 bg-[#F0F0EC]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
