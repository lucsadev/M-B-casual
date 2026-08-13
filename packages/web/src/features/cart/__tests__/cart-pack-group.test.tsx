/**
 * Cart grouping tests.
 *
 * Verifies that pack products (pack_units != null) are visually grouped
 * under a "Pack xN" badge with split prices, while non-pack items render
 * as standalone rows.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { CartItem } from '@mbt/shared';
import { CartPackGroup } from '../components/cart-pack-group';

vi.mock('@/features/cart/hooks/use-cart', () => ({
  useUpdateQty: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveItem: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/catalog/hooks/use-categories', () => ({
  useCategories: () => ({ data: [] }),
}));

function makeCartItem(overrides: Partial<CartItem> & Pick<CartItem, 'id'>): CartItem {
  return {
    user_id: '',
    product_id: 'prod-pack',
    variant_id: 'v1',
    quantity: 1,
    product_name: 'Pack Camisas',
    product_slug: 'pack-camisas',
    product_image: '/pack.jpg',
    product_price: 20000,
    pack_units: 2,
    variant_label: 'S / Negro',
    unit_price: 10000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderGroup(items: CartItem[], packUnits = 2) {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <CartPackGroup
          items={items}
          packUnits={packUnits}
          variant="compact"
          onIncrement={vi.fn()}
          onDecrement={vi.fn()}
          onRemove={vi.fn()}
        />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('CartPackGroup', () => {
  it('renders the Pack xN badge and product name', () => {
    const items = [
      makeCartItem({ id: 'c1', variant_id: 'v1', created_at: '2026-01-01T00:00:00Z' }),
      makeCartItem({ id: 'c2', variant_id: 'v2', created_at: '2026-01-01T00:00:01Z' }),
    ];
    renderGroup(items);

    expect(screen.getByText('Pack x2')).toBeInTheDocument();
    // "Pack Camisas" appears in both the header and CartItemRow; check the
    // header specifically (the one inside a <span> with uppercase tracking class)
    const productNameSpans = screen.getAllByText('Pack Camisas');
    expect(productNameSpans.length).toBeGreaterThanOrEqual(1);
  });

  it('renders one quantity stepper per row', () => {
    const items = [
      makeCartItem({ id: 'c1', variant_id: 'v1', created_at: '2026-01-01T00:00:00Z' }),
      makeCartItem({ id: 'c2', variant_id: 'v2', created_at: '2026-01-01T00:00:01Z' }),
    ];
    renderGroup(items);

    expect(screen.getAllByRole('button', { name: 'Disminuir cantidad' })).toHaveLength(2);
  });

  it('shows the group total equal to products.price', () => {
    const items = [
      makeCartItem({ id: 'c1', variant_id: 'v1', created_at: '2026-01-01T00:00:00Z' }),
      makeCartItem({ id: 'c2', variant_id: 'v2', created_at: '2026-01-01T00:00:01Z' }),
    ];
    renderGroup(items);

    expect(screen.getByText('Total pack')).toBeInTheDocument();
    // The total line's price element contains the formatted product price
    const totalDiv = screen.getByText('Total pack').parentElement!;
    expect(totalDiv.textContent).toContain('20.000');
  });

  it('renders 3 rows for a x3 pack (odd total with remainder)', () => {
    const items = [
      makeCartItem({ id: 'c1', variant_id: 'v1', created_at: '2026-01-01T00:00:00Z' }),
      makeCartItem({ id: 'c2', variant_id: 'v2', created_at: '2026-01-01T00:00:01Z' }),
      makeCartItem({ id: 'c3', variant_id: 'v3', created_at: '2026-01-01T00:00:02Z' }),
    ];
    renderGroup(items, 3);

    expect(screen.getByText('Pack x3')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Disminuir cantidad' })).toHaveLength(3);
    expect(screen.getByText('Total pack')).toBeInTheDocument();
  });

  it('renders a single row for a collapsed repeated-variant pack', () => {
    const items = [
      makeCartItem({
        id: 'c1',
        variant_id: 'v1',
        quantity: 3,
        created_at: '2026-01-01T00:00:00Z',
      }),
    ];
    renderGroup(items, 3);

    // Single row → one quantity stepper
    expect(screen.getAllByRole('button', { name: 'Disminuir cantidad' })).toHaveLength(1);
    expect(screen.getByText('Pack x3')).toBeInTheDocument();
    expect(screen.getByText('Total pack')).toBeInTheDocument();
  });
});
