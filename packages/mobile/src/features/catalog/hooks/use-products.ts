/**
 * useProducts — useInfiniteQuery hook for paginated products (mobile).
 *
 * Supports infinite scroll via useInfiniteQuery. Each page is fetched
 * using offset-based pagination. Query key includes all filters serialized
 * to ensure proper cache invalidation and sharing.
 */
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogFilters, PaginatedResponse, Product } from '@mbt/shared';
import { buildPagination } from '@mbt/shared';
import { getProducts } from '../api/queries';

function serializeFilters(filters: Omit<CatalogFilters, 'page'>): string {
  return JSON.stringify({
    category: filters.category ?? '',
    search: filters.search ?? '',
    tags: filters.tags ?? '',
    priceMin: filters.priceMin ?? 0,
    priceMax: filters.priceMax ?? 0,
  });
}

function productsQueryKey(filters: Omit<CatalogFilters, 'page'>) {
  return ['products', serializeFilters(filters)] as const;
}

export function useProducts(filters: Omit<CatalogFilters, 'page'>) {
  const pageSize = filters.pageSize ?? 20;
  const queryClient = useQueryClient();

  return useInfiniteQuery<PaginatedResponse<Product>>({
    queryKey: productsQueryKey(filters),
    queryFn: async ({ pageParam }) => {
      const pagination = buildPagination(pageParam as number, pageSize);
      return getProducts(filters, pagination);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10, // 10 minutes for better cache retention
  });
}

/**
 * Prefetch product details when it becomes visible in the list.
 * This reduces perceived load time when navigating to product detail.
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  
  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', slug],
      queryFn: async () => {
        const { getProductBySlug } = await import('../api/queries');
        return getProductBySlug(slug);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
}
