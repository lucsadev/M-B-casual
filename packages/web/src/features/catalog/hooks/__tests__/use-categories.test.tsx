/**
 * useCategories hook tests.
 *
 * Mocks the queries module to return controlled data
 * without requiring a real Supabase connection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCategories } from '../use-categories';

// Mock the queries module — all exports become mock functions
vi.mock('../../api/queries', () => ({
  getCategories: vi.fn(),
}));

const mockCategories = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Mujer',
    slug: 'mujer',
    description: 'Ropa y accesorios para mujer',
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Hombre',
    slug: 'hombre',
    description: 'Ropa y accesorios para hombre',
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Import after mock so the mock applies
import * as queries from '../../api/queries';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.getCategories).mockResolvedValue(mockCategories);
  });

  it('returns categories from the API', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(queries.getCategories).toHaveBeenCalledTimes(1);
  });

  it('returns loading state initially', async () => {
    vi.mocked(queries.getCategories).mockImplementationOnce(
      () => new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('propagates errors from the API', async () => {
    const testError = new Error('Network error');
    vi.mocked(queries.getCategories).mockRejectedValueOnce(testError);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
