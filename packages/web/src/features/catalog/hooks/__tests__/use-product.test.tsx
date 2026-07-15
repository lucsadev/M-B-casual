/**
 * useProduct hook tests.
 *
 * Mocks the queries module to return a single product
 * by slug, including error handling scenarios.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useProduct } from '../use-product';

vi.mock('../../api/queries', () => ({
  getProductBySlug: vi.fn(),
}));

import * as queries from '../../api/queries';

const mockProduct = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  categoryId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  name: 'Camisa Oversize Blanca',
  slug: 'camisa-oversize-blanca',
  description: 'Una camisa blanca oversize',
  price: 15000,
  images: ['https://example.com/image.jpg'],
  tags: ['nuevo', 'oferta'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-15T12:00:00Z',
  variants: [
    {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      size: 'M',
      color: 'Blanco',
      colorHex: '#FFFFFF',
      stock: 10,
      sku: 'CAM-OVS-BLA-M',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
};

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

describe('useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.getProductBySlug).mockResolvedValue(mockProduct);
  });

  it('returns a product by slug', async () => {
    const { result } = renderHook(() => useProduct('camisa-oversize-blanca'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProduct);
    expect(queries.getProductBySlug).toHaveBeenCalledWith('camisa-oversize-blanca');
  });

  it('returns null when slug is not found', async () => {
    vi.mocked(queries.getProductBySlug).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useProduct('non-existent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('does not fetch when slug is empty', () => {
    const { result } = renderHook(() => useProduct(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(queries.getProductBySlug).not.toHaveBeenCalled();
  });

  it('propagates errors from the API', async () => {
    const testError = new Error('Failed to fetch product');
    vi.mocked(queries.getProductBySlug).mockRejectedValueOnce(testError);

    const { result } = renderHook(() => useProduct('camisa-oversize-blanca'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
