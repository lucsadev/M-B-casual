/**
 * useProduct — TanStack Query hook for fetching a single product by slug.
 *
 * Returns the product with its variants included. Stale time is 1 minute
 * since product details change infrequently during a browsing session.
 */
import { useQuery } from '@tanstack/react-query';
import type { Product, ProductVariant } from '@mbt/shared';
import { getProductBySlug } from '../api/queries';

/**
 * Build the query key for a single product lookup.
 */
function productQueryKey(slug: string) {
  return ['product', slug] as const;
}

/**
 * Fetch a single product by its URL-friendly slug, including variants.
 *
 * Returns null when the slug does not match any active product.
 *
 * @example
 * ```ts
 * const { data: product, isLoading } = useProduct('camisa-oversize-blanca');
 *
 * if (product) {
 *   console.log(product.name, product.variants);
 * }
 * ```
 */
export function useProduct(slug: string) {
  return useQuery<Product & { variants: ProductVariant[] } | null>({
    queryKey: productQueryKey(slug),
    queryFn: () => getProductBySlug(slug),
    staleTime: 1000 * 60, // 1 minute
    enabled: slug.length > 0,
  });
}
