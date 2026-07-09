/**
 * useCategories — TanStack Query hook for fetching active categories.
 *
 * Categories change infrequently, so staleTime is set to 5 minutes
 * to reduce unnecessary network requests.
 */
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@mbt/shared';
import { getCategories } from '../api/queries';

export const CATEGORIES_KEY = ['categories'] as const;

/**
 * Fetch all active categories ordered by sort_order.
 *
 * @example
 * ```ts
 * const { data: categories, isLoading } = useCategories();
 * ```
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_KEY,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes — categories rarely change
  });
}
