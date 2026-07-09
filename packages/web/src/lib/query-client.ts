import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client configuration for the web app.
 *
 * - staleTime: 30s — data is fresh for 30 seconds before refetch
 * - gcTime: 5min — unused data stays in cache for 5 minutes
 * - retry: 1 — retry once on failure
 * - refetchOnWindowFocus: true — keep data fresh when user returns
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
