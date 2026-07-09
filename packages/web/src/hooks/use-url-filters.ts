/**
 * useUrlFilters — Read and write catalog filter state via URL search params.
 *
 * Two-way sync between component state and URL query parameters:
 * - Reading: parses `?category=...&q=...` on mount
 * - Writing: updates URL when filters change (without full page reload)
 *
 * @example
 * ```ts
 * const { category, search, setCategory, setSearch } = useUrlFilters();
 * ```
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UrlFilters {
  category: string;
  search: string;
}

export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('q') ?? '';

  const setCategory = useCallback(
    (slug: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (slug) {
            next.set('category', slug);
          } else {
            next.delete('category');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSearch = useCallback(
    (term: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (term) {
            next.set('q', term);
          } else {
            next.delete('q');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    category,
    search,
    setCategory,
    setSearch,
    clearFilters,
  };
}

export type UseUrlFiltersReturn = ReturnType<typeof useUrlFilters>;
