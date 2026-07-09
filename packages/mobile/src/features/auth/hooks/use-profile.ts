/**
 * useProfile — Profile query + mutation hooks for mobile.
 *
 * Fetches customer profile data from the `customers` table and provides
 * a mutation to update it. Mirrors the web hook pattern in
 * packages/web/src/features/customers/hooks/use-profile.ts.
 *
 * Data flow:
 * - Query: SELECT from `customers` table by user_id (from session)
 * - Mutation: UPSERT into `customers` (create-or-update since handle_new_user
 *   trigger may not have completed yet)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { CustomerProfile, ProfileUpdateInput } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

type CustomerRow = Database['public']['Tables']['customers']['Row'];

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const PROFILE_QUERY_KEY = ['customer'] as const;

// ---------------------------------------------------------------------------
// useProfile — fetch the customer profile
// ---------------------------------------------------------------------------

export interface UseProfileReturn {
  /** The customer profile, or null if not loaded */
  profile: CustomerProfile | null;
  /** True while the initial fetch is in flight */
  isLoading: boolean;
  /** Error from the fetch, or null */
  error: Error | null;
  /** Manually refetch the profile */
  refetch: () => void;
}

export function useProfile(): UseProfileReturn {
  const {
    data: profile = null,
    isLoading,
    error,
    refetch,
  } = useQuery<CustomerProfile | null>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle<CustomerRow>();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        firstName: data.first_name,
        lastName: data.last_name ?? '',
        phone: data.phone,
        address: data.address as Record<string, unknown> | null,
        email: user.email ?? '',
        createdAt: data.created_at,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes — profile rarely changes
  });

  return { profile, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// useUpdateProfile — save profile changes
// ---------------------------------------------------------------------------

export interface UseUpdateProfileReturn {
  /** Submit profile updates */
  update: (input: ProfileUpdateInput) => Promise<void>;
  /** True while the update is in flight */
  isPending: boolean;
  /** Error from the update, or null */
  error: Error | null;
}

export function useUpdateProfile(): UseUpdateProfileReturn {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation<void, Error, ProfileUpdateInput>({
    mutationFn: async (input) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error: upsertError } = await (supabase.from('customers') as any).upsert(
        {
          user_id: user.id,
          first_name: input.firstName,
          last_name: input.lastName ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
        },
        { onConflict: 'user_id' },
      );

      if (upsertError) throw upsertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  return { update: mutateAsync, isPending, error };
}