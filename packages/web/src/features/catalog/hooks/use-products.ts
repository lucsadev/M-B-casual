/**
 * useProducts — TanStack Query hook for fetching paginated products.
 *
 * Supports infinite scroll via useInfiniteQuery. Each page is fetched
 * using offset-based pagination. The hook accepts CatalogFilters for
 * filtering (category, search, tags, price range) and uses pageSize
 * from the filters for the page size.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import type { CatalogFilters, PaginatedResponse, Product } from '@mbt/shared';
import { buildPagination } from '@mbt/shared';
import { getProducts } from '../api/queries';

/**
 * Build the query key for products based on filter values.
 * Excludes `page` since useInfiniteQuery manages that via pageParam.
 */
function productsQueryKey(filters: Omit<CatalogFilters, 'page'>) {
  return ['products', filters] as const;
}

/**
 * Fetch paginated products with filtering support.
 *
 * Returns a useInfiniteQuery result where each page is a
 * PaginatedResponse<Product>. Use `data.pages.flatMap(p => p.data)`
 * to get the flattened product list.
 *
 * @example
 * ```ts
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useProducts({ category: 'mujer', search: '', pageSize: 20 });
 *
 * const products = data?.pages.flatMap(p => p.data) ?? [];
 * ```
 */
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
    staleTime: 1000 * 30, // 30 seconds — products change more often
  });
}
