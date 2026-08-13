/**
 * ProductDetailPage component tests.
 *
 * Covers the color-scoped size list wiring and the auto-select behavior:
 * - Mount preselect picks the first in-stock variant.
 * - Size list swaps to the selected color's full size set, with 0-stock chips
 *   rendered disabled instead of hidden (Agotado feature).
 * - When the current size is unavailable in the newly selected color, the
 *   first in-stock size of that color is selected automatically.
 * - No-deselect: tapping the already-selected color or size chip is a no-op —
 *   the chip stays highlighted and the same variant stays resolved.
 * - Add-to-cart always receives a non-null, in-stock variant id.
 *
 * The data hooks (useProduct, useCategories) and the cart context are mocked;
 * ProductQuestions is stubbed out to keep the test focused on the selector.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { Product, ProductVariant } from '@mbt/shared';
import { ProductDetailPage } from '../product-detail-page';

vi.mock('@/features/catalog/hooks/use-product', () => ({
  useProduct: vi.fn(),
}));

vi.mock('@/features/catalog/hooks/use-categories', () => ({
  useCategories: vi.fn(),
}));

vi.mock('@/features/cart/context/CartContext', () => ({
  useCartContext: vi.fn(),
}));

vi.mock('@/features/catalog/components/product-questions', () => ({
  ProductQuestions: () => null,
}));

import { useProduct } from '@/features/catalog/hooks/use-product';
import { useCategories } from '@/features/catalog/hooks/use-categories';
import { useCartContext } from '@/features/cart/context/CartContext';

const mockAddToCart = vi.fn();

function variant(overrides: Partial<ProductVariant> & Pick<ProductVariant, 'id'>): ProductVariant {
  return {
    productId: 'prod-1',
    createdAt: '2026-01-01T00:00:00Z',
    stock: 0,
    ...overrides,
  };
}

const product: Product & { variants: ProductVariant[] } = {
  id: 'prod-1',
  categoryId: 'cat-1',
  name: 'Camisa Oversize',
  slug: 'camisa-oversize',
  description: 'Una camisa',
  price: 15000,
  images: ['/img1.jpg', '/img2.jpg'],
  tags: [],
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-15T12:00:00Z',
  variants: [
    variant({ id: 'v1', size: 'S', color: 'Negro', stock: 3 }),
    variant({ id: 'v2', size: 'M', color: 'Negro', stock: 5 }),
    variant({ id: 'v3', size: 'L', color: 'Negro', stock: 0 }),
    variant({ id: 'v4', size: 'M', color: 'Blanco', stock: 2 }),
    variant({ id: 'v5', size: 'XL', color: 'Blanco', stock: 0 }),
  ],
};

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/producto/camisa-oversize']}>
        <Routes>
          <Route path="/producto/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('ProductDetailPage variant selector', () => {
  beforeEach(() => {
    mockAddToCart.mockClear();
    vi.mocked(useProduct).mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);
    vi.mocked(useCategories).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCategories>);
    vi.mocked(useCartContext).mockReturnValue({
      items: [],
      totalItems: 0,
      summary: { subtotal: 0, shipping_cost: 0, discount: 0, total: 0, item_count: 0 },
      isLoading: false,
      isError: false,
      addToCart: mockAddToCart,
      isAddingToCart: false,
      refetchCart: vi.fn(),
    } as unknown as ReturnType<typeof useCartContext>);
  });

  it('preselects the first in-stock variant on mount (no selection)', async () => {
    renderPage();

    // First in-stock variant is v1 (S / Negro) — both chips must be highlighted.
    const sizeButton = await screen.findByRole('button', { name: 'S' });
    expect(sizeButton).toHaveClass('bg-[#E8836B]');
    expect(screen.getByRole('button', { name: 'Negro' })).toHaveClass(
      'bg-[#E8836B]/10',
    );
  });

  it('swaps the size list to the selected color in-stock sizes on color change', async () => {
    renderPage();

    const blancoButton = await screen.findByRole('button', { name: 'Blanco' });
    fireEvent.click(blancoButton);

    await waitFor(() => {
      // Blanco has M in stock and XL with stock 0 — the size list now shows ALL
      // Blanco sizes, rendering the 0-stock XL disabled instead of hidden. S
      // stays absent entirely (it does not exist as a Blanco variant).
      expect(screen.queryByRole('button', { name: 'S' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'XL' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument();
    });
  });

  it('auto-selects the first in-stock size of the new color when the current size is unavailable', async () => {
    renderPage();

    // Mount preselect picks S (Negro). Switch to Blanco where S is not in stock.
    const blancoButton = await screen.findByRole('button', { name: 'Blanco' });
    fireEvent.click(blancoButton);

    // M is the first in-stock size of Blanco and must become the highlighted chip.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'M' })).toHaveClass(
        'bg-[#E8836B]',
      );
    });
    // The size list is scoped to Blanco: S (only a Negro size) is gone entirely;
    // XL (0-stock in Blanco) renders but disabled.
    expect(screen.queryByRole('button', { name: 'S' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'XL' })).toBeDisabled();
  });

  it('keeps the current size when it is still available in the new color', async () => {
    renderPage();

    // Select M in Negro first (M exists in both colors).
    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    const blancoButton = await screen.findByRole('button', { name: 'Blanco' });
    fireEvent.click(blancoButton);

    await waitFor(() => {
      // M is in stock in Blanco, so it stays selected.
      expect(screen.getByRole('button', { name: 'M' })).toHaveClass(
        'bg-[#E8836B]',
      );
    });
  });

  it('keeps the already-selected color selected when tapped again (no deselect)', async () => {
    renderPage();

    // Mount preselect picks S / Negro.
    const negroButton = await screen.findByRole('button', { name: 'Negro' });
    expect(negroButton).toHaveClass('bg-[#E8836B]/10');
    expect(screen.getByRole('button', { name: 'S' })).toHaveClass(
      'bg-[#E8836B]',
    );

    // Tap the already-selected color again — it must stay selected and the
    // same variant (S / Negro) must stay resolved.
    fireEvent.click(negroButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Negro' })).toHaveClass(
        'bg-[#E8836B]/10',
      );
      expect(screen.getByRole('button', { name: 'S' })).toHaveClass(
        'bg-[#E8836B]',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));

    // v1 = S / Negro (in stock) — the selection never changed.
    expect(mockAddToCart).toHaveBeenCalledWith({
      product_id: 'prod-1',
      variant_id: 'v1',
      quantity: 1,
    });
  });

  it('keeps the already-selected size selected when tapped again (no-toggle)', async () => {
    renderPage();

    const sizeButton = await screen.findByRole('button', { name: 'S' });
    expect(sizeButton).toHaveClass('bg-[#E8836B]');

    // Tap the already-selected size again — it must stay selected.
    fireEvent.click(sizeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'S' })).toHaveClass(
        'bg-[#E8836B]',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));

    // v1 = S / Negro (in stock) — the selection never changed.
    expect(mockAddToCart).toHaveBeenCalledWith({
      product_id: 'prod-1',
      variant_id: 'v1',
      quantity: 1,
    });
  });

  it('adds to cart with a non-null in-stock variant id after a color switch', async () => {
    renderPage();

    const blancoButton = await screen.findByRole('button', { name: 'Blanco' });
    fireEvent.click(blancoButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'M' })).toHaveClass(
        'bg-[#E8836B]',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));

    // v4 = M / Blanco (in stock) — the only valid variant for the selection.
    expect(mockAddToCart).toHaveBeenCalledWith({
      product_id: 'prod-1',
      variant_id: 'v4',
      quantity: 1,
    });
  });

  it('repairs both size and color when a refetch zeroes the selected color stock', async () => {
    const { rerender } = renderPage();

    // Mount preselect picks S / Negro.
    const negroButton = await screen.findByRole('button', { name: 'Negro' });
    expect(negroButton).toHaveClass('bg-[#E8836B]/10');
    expect(screen.getByRole('button', { name: 'S' })).toHaveClass(
      'bg-[#E8836B]',
    );

    // Background refetch zeroes ALL Negro stock; only M / Blanco remains.
    vi.mocked(useProduct).mockReturnValue({
      data: {
        ...product,
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 0 }),
          variant({ id: 'v2', size: 'M', color: 'Negro', stock: 0 }),
          variant({ id: 'v4', size: 'M', color: 'Blanco', stock: 2 }),
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    rerender(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/producto/camisa-oversize']}>
          <Routes>
            <Route path="/producto/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );

    // The dead color is repaired to the only remaining in-stock option:
    // Blanco chip highlighted, M size chip highlighted, Negro chip disabled
    // (still rendered, now with no stock).
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Blanco' })).toHaveClass(
        'bg-[#E8836B]/10',
      );
      expect(screen.getByRole('button', { name: 'M' })).toHaveClass(
        'bg-[#E8836B]',
      );
    });
    expect(screen.getByRole('button', { name: 'Negro' })).toBeDisabled();
  });
});

describe('ProductDetailPage image swipe/drag', () => {
  beforeEach(() => {
    vi.mocked(useProduct).mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);
    vi.mocked(useCategories).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCategories>);
    vi.mocked(useCartContext).mockReturnValue({
      items: [],
      totalItems: 0,
      summary: { subtotal: 0, shipping_cost: 0, discount: 0, total: 0, item_count: 0 },
      isLoading: false,
      isError: false,
      addToCart: mockAddToCart,
      isAddingToCart: false,
      refetchCart: vi.fn(),
    } as unknown as ReturnType<typeof useCartContext>);
  });

  function mainImageEl() {
    return screen.getByLabelText(
      'Imágenes del producto: mantené presionado y arrastrá para cambiar',
    );
  }

  function swipe(startX: number, endX: number) {
    const el = mainImageEl();
    fireEvent.pointerDown(el, { pointerId: 1, clientX: startX });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: endX });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: endX });
    // jsdom does not run CSS transitions, so the cloned-wrap swap that happens
    // in the real transitionend must be dispatched manually.
    fireEvent.transitionEnd(el);
  }

  it('swipes left to the next image (2 / 2)', () => {
    renderPage();
    const counter = () => screen.getByText(/\/ 2$/);
    expect(counter()).toHaveTextContent('1 / 2');

    // Drag left by 200px (> 25% of the 320px fallback width) to go next.
    swipe(200, 0);

    expect(counter()).toHaveTextContent('2 / 2');
  });

  it('swipes right to go back to the previous image', () => {
    renderPage();
    const counter = () => screen.getByText(/\/ 2$/);

    swipe(200, 0); // forward
    expect(counter()).toHaveTextContent('2 / 2');

    swipe(0, 200); // back
    expect(counter()).toHaveTextContent('1 / 2');
  });

  it('does not flip when the drag is below the threshold', () => {
    renderPage();
    const counter = () => screen.getByText(/\/ 2$/);

    // Drag left but only 20px — below the 80px threshold, stays on 1 / 2.
    swipe(100, 80);

    expect(counter()).toHaveTextContent('1 / 2');
  });

  it('wraps from the last image back to the first', () => {
    renderPage();
    const counter = () => screen.getByText(/\/ 2$/);

    swipe(200, 0); // 1 → 2
    expect(counter()).toHaveTextContent('2 / 2');

    swipe(200, 0); // 2 → 1 (wrap)
    expect(counter()).toHaveTextContent('1 / 2');
  });

  it('wraps from the first image forward to the last', () => {
    renderPage();
    const counter = () => screen.getByText(/\/ 2$/);

    swipe(0, 200); // 1 → 2 (wrap backward)
    expect(counter()).toHaveTextContent('2 / 2');
  });
});

// ---------------------------------------------------------------------------
// Pack builder (design 5.2 — repeat-aware stock, all-or-nothing, collapse)
// ---------------------------------------------------------------------------

describe('ProductDetailPage pack builder', () => {
  function packProduct(
    overrides: Partial<Product & { variants: ProductVariant[] }> = {},
  ) {
    return {
      ...product,
      packUnits: 2,
      price: 20000,
      variants: [] as ProductVariant[],
      ...overrides,
    } as Product & { variants: ProductVariant[] };
  }

  function renderPackPage() {
    return render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/producto/camisa-oversize']}>
          <Routes>
            <Route path="/producto/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );
  }

  beforeEach(() => {
    mockAddToCart.mockClear();
    vi.mocked(useCategories).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCategories>);
    vi.mocked(useCartContext).mockReturnValue({
      items: [],
      totalItems: 0,
      summary: { subtotal: 0, shipping_cost: 0, discount: 0, total: 0, item_count: 0 },
      isLoading: false,
      isError: false,
      addToCart: mockAddToCart,
      isAddingToCart: false,
      refetchCart: vi.fn(),
    } as unknown as ReturnType<typeof useCartContext>);
  });

  it('renders N slots, the Pack badge and total pack price', async () => {
    vi.mocked(useProduct).mockReturnValue({
      data: packProduct({
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 3 }),
          variant({ id: 'v2', size: 'M', color: 'Negro', stock: 5 }),
        ],
      }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    renderPackPage();

    expect(await screen.findByTestId('pack-slot-1')).toBeInTheDocument();
    expect(screen.getByTestId('pack-slot-2')).toBeInTheDocument();
    const slot1 = screen.getByTestId('pack-slot-1');
    const slot2 = screen.getByTestId('pack-slot-2');
    expect(screen.getByText('Pack x2')).toBeInTheDocument();
    expect(screen.getByText('Precio total del pack')).toBeInTheDocument();
    // Total price: formatPrice(20000) → "$20.000,00"
    expect(screen.getByText(/20\.000/)).toBeInTheDocument();
    // Unit prices only render once a slot has a selection — verify they appear
    // after filling both slots
    fireEvent.click(within(slot1).getByRole('button', { name: 'S' }));
    fireEvent.click(within(slot2).getByRole('button', { name: 'M' }));
    await waitFor(() =>
      expect(screen.getAllByText(/10\.000/)).toHaveLength(2),
    );
  });

  it('enables add-to-cart only when every slot is filled, then adds one row per distinct variant', async () => {
    vi.mocked(useProduct).mockReturnValue({
      data: packProduct({
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 3 }),
          variant({ id: 'v2', size: 'M', color: 'Negro', stock: 5 }),
        ],
      }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    renderPackPage();

    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    const slot1 = await screen.findByTestId('pack-slot-1');
    const slot2 = screen.getByTestId('pack-slot-2');

    // Initially disabled — no slots filled
    expect(addButton).toBeDisabled();

    // Fill slot 1 with S (auto-selects Negro — only color available)
    fireEvent.click(within(slot1).getByRole('button', { name: 'S' }));
    await waitFor(() => expect(addButton).toBeDisabled());

    // Fill slot 2 with M
    fireEvent.click(within(slot2).getByRole('button', { name: 'M' }));
    await waitFor(() => expect(addButton).toBeEnabled());

    fireEvent.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(2);
    expect(mockAddToCart).toHaveBeenCalledWith({
      product_id: 'prod-1',
      variant_id: 'v1',
      quantity: 1,
    });
    expect(mockAddToCart).toHaveBeenCalledWith({
      product_id: 'prod-1',
      variant_id: 'v2',
      quantity: 1,
    });
  });

  it('collapses repeated variants into a single cart row with summed quantity', async () => {
    vi.mocked(useProduct).mockReturnValue({
      data: packProduct({
        packUnits: 3,
        price: 10000,
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 5 }),
        ],
      }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    renderPackPage();

    const slot1 = await screen.findByTestId('pack-slot-1');
    const slot2 = screen.getByTestId('pack-slot-2');
    const slot3 = screen.getByTestId('pack-slot-3');

    fireEvent.click(within(slot1).getByRole('button', { name: 'S' }));
    fireEvent.click(within(slot2).getByRole('button', { name: 'S' }));
    fireEvent.click(within(slot3).getByRole('button', { name: 'S' }));

    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    await waitFor(() => expect(addButton).toBeEnabled());

    fireEvent.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith({
      product_id: 'prod-1',
      variant_id: 'v1',
      quantity: 3,
    });
  });

  it('disables a size/color chip when the variant stock is exhausted by picks in other slots', async () => {
    vi.mocked(useProduct).mockReturnValue({
      data: packProduct({
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 1 }),
          variant({ id: 'v2', size: 'M', color: 'Negro', stock: 0 }),
        ],
      }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    renderPackPage();

    const slot1 = await screen.findByTestId('pack-slot-1');
    const slot2 = screen.getByTestId('pack-slot-2');

    // Only S is in stock (M stock 0 → excluded from chips)
    fireEvent.click(within(slot1).getByRole('button', { name: 'S' }));

    // Slot 2: S chip is exhausted (stock 1 fully committed by slot 1)
    expect(within(slot2).getByRole('button', { name: 'S' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeDisabled();
  });

  it('shows the insufficient-stock state and blocks adding after a refetch zeroes the slot variant stock', async () => {
    vi.mocked(useProduct).mockReturnValue({
      data: packProduct({
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 3 }),
          variant({ id: 'v2', size: 'M', color: 'Negro', stock: 5 }),
        ],
      }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    const { rerender } = renderPackPage();

    const slot1 = await screen.findByTestId('pack-slot-1');
    const slot2 = screen.getByTestId('pack-slot-2');
    fireEvent.click(within(slot1).getByRole('button', { name: 'S' }));
    fireEvent.click(within(slot2).getByRole('button', { name: 'M' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeEnabled(),
    );

    // Background refetch zeroes S stock
    vi.mocked(useProduct).mockReturnValue({
      data: packProduct({
        variants: [
          variant({ id: 'v1', size: 'S', color: 'Negro', stock: 0 }),
          variant({ id: 'v2', size: 'M', color: 'Negro', stock: 5 }),
        ],
      }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProduct>);

    rerender(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/producto/camisa-oversize']}>
          <Routes>
            <Route path="/producto/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(within(slot1).getByText('Sin stock para esta variante')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeDisabled();
  });
});
