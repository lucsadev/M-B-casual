/**
 * useCategories — TanStack Query hook for fetching active categories.
 *
 * Same API key as the web hook (CATEGORIES_KEY) so cache is shared
 * when both platforms use the same AsyncStorage persister.
 * Stale time: 5 minutes — categories change infrequently.
 */
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@mbt/shared';
import { getCategories } from '../api/queries';

export const CATEGORIES_KEY = ['categories'] as const;

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_KEY,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5,
  });
}
