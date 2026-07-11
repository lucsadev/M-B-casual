/**
 * useDiscountedProducts — TanStack Query hook for fetching products
 * that have at least one variant with discount > 0.
 *
 * Includes computed `effectivePrice` (cheapest variant after discount)
 * and `variantDiscountPercent` (highest variant discount %).
 */
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@mbt/shared';
import { getDiscountedProducts } from '../api/queries';

export function useDiscountedProducts(limit = 8) {
  return useQuery<Product[]>({
    queryKey: ['products', 'discounted', limit],
    queryFn: () => getDiscountedProducts({ limit }),
    staleTime: 1000 * 30,
  });
}
