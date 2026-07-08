/**
 * useOrders — TanStack Query hook for customer order history.
 *
 * Fetches orders for a given customer ID (obtained from the profile).
 * Requires the customer to be authenticated and have a profile row.
 *
 * Cache key: ['customer-orders', customerId]
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getOrders } from '../api/queries';
import type { Database } from '@/lib/database.types';

type OrderRow = Database['public']['Tables']['orders']['Row'];

// ---------------------------------------------------------------------------
// useOrders
// ---------------------------------------------------------------------------

/**
 * Fetch all orders for the current customer, sorted newest first.
 *
 * Automatically resolves the customer ID from the session's profile.
 *
 * @example
 * const { data: orders, isLoading } = useOrders();
 */
export function useOrders() {
  return useQuery<OrderRow[]>({
    queryKey: ['customer-orders', 'me'],
    queryFn: async () => {
      // 1. Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // 2. Get customer ID for this user
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .single<{ id: string }>();

      if (customerError) throw customerError;
      if (!customer) throw new Error('Perfil de cliente no encontrado');

      // 3. Fetch orders by customer ID
      return getOrders(customer.id);
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 1,
  });
}
