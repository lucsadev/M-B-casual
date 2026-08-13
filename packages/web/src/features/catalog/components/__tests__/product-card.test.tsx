/**
 * ProductCard tests — "Agotado" (out-of-stock) badge behavior.
 *
 * Covers the web storefront requirement: a product whose total stock is 0 stays
 * listed but shows an "Agotado" badge, while other badges still render.
 * `totalStock` is optional on the shared Product type, so cards fed with
 * products that carry no stock info (undefined) must not show the badge.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '@mbt/shared';
import { ProductCard } from '../product-card';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    categoryId: 'cat-1',
    name: 'Camisa Oversize',
    slug: 'camisa-oversize',
    description: 'Una camisa',
    price: 15000,
    images: ['/img1.jpg'],
    tags: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
    ...overrides,
  };
}

function renderCard(p: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={p} />
    </MemoryRouter>,
  );
}

describe('ProductCard', () => {
  it('renders the product name', () => {
    renderCard(product());
    expect(screen.getByText('Camisa Oversize')).toBeInTheDocument();
  });

  it('shows the "Agotado" badge when totalStock is 0', () => {
    renderCard(product({ totalStock: 0 }));
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  it('does not show "Agotado" when totalStock is undefined (unknown)', () => {
    renderCard(product());
    expect(screen.queryByText('Agotado')).not.toBeInTheDocument();
  });

  it('does not show "Agotado" when totalStock is positive', () => {
    renderCard(product({ totalStock: 4 }));
    expect(screen.queryByText('Agotado')).not.toBeInTheDocument();
  });

  it('renders other badges together with "Agotado"', () => {
    renderCard(
      product({
        totalStock: 0,
        tags: ['nuevo'],
        variantDiscountPercent: 25,
        effectivePrice: 11250,
      }),
    );
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });
});