/**
 * useProduct — TanStack Query hook for fetching a single product by slug (mobile).
 *
 * Same query key pattern as web ['product', slug] for cache compatibility.
 * Returns the product with its variants included.
 */
import { useQuery } from '@tanstack/react-query';
import type { Product, ProductVariant } from '@mbt/shared';
import { getProductBySlug } from '../api/queries';

function productQueryKey(slug: string) {
  return ['product', slug] as const;
}

export function useProduct(slug: string) {
  return useQuery<Product & { variants: ProductVariant[] } | null>({
    queryKey: productQueryKey(slug),
    queryFn: () => getProductBySlug(slug),
    staleTime: 1000 * 60,
    enabled: slug.length > 0,
  });
}
