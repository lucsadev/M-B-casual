/**
 * TanStack Query client configuration for the mobile app.
 *
 * - staleTime: 30s — data is fresh for 30 seconds before refetch
 * - gcTime: 5min — unused data stays in cache for 5 minutes
 * - retry: 1 — retry once on failure
 * - refetchOnWindowFocus: false — no window focus concept in native apps,
 *   but pull-to-refresh provides manual refetch
 *
 * Persistence is configured separately via storage.ts and the
 * persistQueryClient call in _layout.tsx.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
