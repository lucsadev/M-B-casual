/**
 * useProducts — useInfiniteQuery hook for paginated products (mobile).
 *
 * Supports infinite scroll via useInfiniteQuery. Each page is fetched
 * using offset-based pagination. Query key matches the web hook pattern
 * so cache sharing is possible when the same persister is configured.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import type { CatalogFilters, PaginatedResponse, Product } from '@mbt/shared';
import { buildPagination } from '@mbt/shared';
import { getProducts } from '../api/queries';

function productsQueryKey(filters: Omit<CatalogFilters, 'page'>) {
  return ['products', filters] as const;
}

export function useProducts(filters: Omit<CatalogFilters, 'page'>) {
  const pageSize = filters.pageSize ?? 20;

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
  });
}
