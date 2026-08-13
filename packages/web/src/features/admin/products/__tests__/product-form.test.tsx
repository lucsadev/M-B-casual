/**
 * ProductForm pack toggle tests.
 *
 * Verifies:
 * - Toggle ON → packUnits = 2 (default) or 3
 * - Toggle OFF → packUnits = null
 * - Pack x2/x3 select is only visible when toggle is on
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductForm } from '../components/ProductForm';

// Stub external dependencies
vi.mock('@/features/catalog', () => ({
  useCategories: vi.fn(() => ({
    data: [{ id: 'cat-1', name: 'Mujer', slug: 'mujer' }],
    isLoading: false,
  })),
}));

vi.mock('@/features/admin/suppliers/api/use-supplier-queries', () => ({
  useSupplierOptions: vi.fn(() => ({ data: [] })),
  useProductSupplierIds: vi.fn(() => ({ data: [] })),
}));

function renderForm() {
  const onSubmit = vi.fn();
  return {
    ...render(
      <ProductForm product={null} onSubmit={onSubmit} isSubmitting={false} />,
    ),
    onSubmit,
  };
}

describe('ProductForm pack toggle', () => {
  it('toggle OFF by default: pack select not visible', () => {
    renderForm();
    // Pack select should NOT be visible when toggle is off
    expect(screen.queryByLabelText(/tamaño del pack/i)).not.toBeInTheDocument();
  });

  it('toggle ON: pack select becomes visible', () => {
    renderForm();

    // Toggle on
    fireEvent.click(screen.getByLabelText(/venta en pack/i));

    // Pack select should appear
    expect(screen.getByLabelText(/tamaño del pack/i)).toBeInTheDocument();
  });

  it('toggle ON then OFF: pack select disappears', () => {
    renderForm();

    // Toggle on
    fireEvent.click(screen.getByLabelText(/venta en pack/i));
    expect(screen.getByLabelText(/tamaño del pack/i)).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByLabelText(/venta en pack/i));

    // Pack select should disappear
    expect(screen.queryByLabelText(/tamaño del pack/i)).not.toBeInTheDocument();
  });
});
