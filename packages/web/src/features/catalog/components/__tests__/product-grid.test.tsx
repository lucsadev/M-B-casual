/**
 * ProductGrid tests — filter-change scroll behavior.
 *
 * Covers the regression where switching category/search left the viewport at
 * the bottom of the previous list (last item) instead of jumping back to the
 * first result. jsdom has no layout/CDP scroll, so scrollIntoView is stubbed
 * and we assert it is called when the filters change.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '@mbt/shared';
import { ProductGrid } from '../product-grid';

vi.mock('@/features/catalog/hooks/use-products', () => ({
  useProducts: vi.fn(),
}));

import { useProducts } from '@/features/catalog/hooks/use-products';

function product(id: string): Product {
  return {
    id,
    categoryId: 'cat-1',
    name: `Producto ${id}`,
    slug: `producto-${id}`,
    description: 'Descripción',
    price: 100,
    images: ['/img.jpg'],
    tags: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
  };
}

const scrollIntoViewMock = vi.fn();

describe('ProductGrid scroll on filter change', () => {
  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    // jsdom doesn't implement scrollIntoView; stub it on the shared prototype.
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    });
    vi.mocked(useProducts).mockReturnValue({
      data: {
        pages: [
          {
            data: Array.from({ length: 3 }, (_, i) => product(`p${i}`)),
            total: 3,
            page: 1,
            pageSize: 12,
            hasNext: false,
          },
        ],
        pageParams: [1],
      },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProducts>);
  });

  it('does not scroll on the initial mount', () => {
    render(
      <MemoryRouter>
        <ProductGrid category="" search="" />
      </MemoryRouter>,
    );
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('scrolls to the first result when the category changes', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProductGrid category="" search="" />
      </MemoryRouter>,
    );
    rerender(
      <MemoryRouter>
        <ProductGrid category="nuevo" search="" />
      </MemoryRouter>,
    );

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it('does not scroll when rerendering with the same category', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProductGrid category="nuevo" search="" />
      </MemoryRouter>,
    );
    rerender(
      <MemoryRouter>
        <ProductGrid category="nuevo" search="" />
      </MemoryRouter>,
    );

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});