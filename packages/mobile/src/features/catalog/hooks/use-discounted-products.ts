import { useQuery } from '@tanstack/react-query';
import { getDiscountedProducts } from '../api/queries';

export function useDiscountedProducts(limit = 8) {
  return useQuery({
    queryKey: ['discounted-products', limit],
    queryFn: () => getDiscountedProducts({ limit }),
    staleTime: 1000 * 60,
  });
}
