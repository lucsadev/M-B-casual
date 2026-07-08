/**
 * useProfile — TanStack Query hooks for customer profile.
 *
 * Provides:
 * - useProfile()        → query that fetches customer profile by auth user
 * - useUpdateProfile()  → mutation to update profile fields, invalidates cache on success
 *
 * Cache key: ['customer', userId] so it refetches when userId changes.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CustomerProfile, ProfileUpdateInput } from '@mbt/shared';
import { getProfile, updateProfile } from '../api/queries';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export function profileQueryKey(userId: string) {
  return ['customer', userId] as const;
}

// ---------------------------------------------------------------------------
// useProfile — fetch customer profile
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's customer profile.
 *
 * @example
 * const { data: profile, isLoading } = useProfile();
 */
export function useProfile() {
  return useQuery<CustomerProfile>({
    queryKey: ['customer', 'me'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');
      return getProfile(userId);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// useUpdateProfile — update profile mutation
// ---------------------------------------------------------------------------

/**
 * Mutation to update profile fields.
 * Invalidates the profile query on success so the UI reflects changes.
 *
 * @example
 * const { mutate: update, isPending } = useUpdateProfile();
 * update({ firstName: 'Nuevo' });
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ProfileUpdateInput>({
    mutationFn: async (input) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');
      await updateProfile(userId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'me'] });
    },
  });
}
