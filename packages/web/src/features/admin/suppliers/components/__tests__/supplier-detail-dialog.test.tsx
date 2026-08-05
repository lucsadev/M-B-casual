import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupplierDetailDialog } from '../SupplierDetailDialog';
import type { Supplier } from '@mbt/shared';

// Mock the products hook so the dialog renders deterministically.
const useSupplierProductsMock = vi.fn();
vi.mock('../../api/use-supplier-queries', () => ({
  useSupplierProducts: (...args: unknown[]) => useSupplierProductsMock(...args),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div className="skeleton" />,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

const mockSupplier: Supplier = {
  id: 'supplier-1',
  name: 'Textil Ríos',
  website: 'https://textilrios.com',
  instagram: 'https://instagram.com/textilrios',
  email: 'ventas@textilrios.com',
  phone: '11 5555 1234',
  address: 'Av. Corrientes 1234, CABA',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('SupplierDetailDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders supplier fields', () => {
    useSupplierProductsMock.mockReturnValue({ data: [], isLoading: false });

    render(
      <TestWrapper>
        <SupplierDetailDialog
          open={true}
          onOpenChange={() => {}}
          supplier={mockSupplier}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Textil Ríos')).toBeInTheDocument();
    expect(screen.getByText('https://textilrios.com')).toBeInTheDocument();
    expect(screen.getByText('https://instagram.com/textilrios')).toBeInTheDocument();
    expect(screen.getByText('ventas@textilrios.com')).toBeInTheDocument();
    expect(screen.getByText('11 5555 1234')).toBeInTheDocument();
    expect(screen.getByText('Av. Corrientes 1234, CABA')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(useSupplierProductsMock).toHaveBeenCalledWith('supplier-1');
  });

  it('renders product rows when products exist', () => {
    useSupplierProductsMock.mockReturnValue({
      data: [
        { id: 'p1', name: 'Camisa Oversize Blanca', slug: 'camisa-oversize', price: 15000, cost: 9000, isActive: true },
        { id: 'p2', name: 'Jean Clásico', slug: 'jean-clasico', price: 25000, isActive: true },
      ],
      isLoading: false,
    });

    render(
      <TestWrapper>
        <SupplierDetailDialog
          open={true}
          onOpenChange={() => {}}
          supplier={mockSupplier}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Camisa Oversize Blanca')).toBeInTheDocument();
    expect(screen.getByText('Jean Clásico')).toBeInTheDocument();
    expect(screen.getByText('$15.000')).toBeInTheDocument();
    expect(screen.getByText('$25.000')).toBeInTheDocument();
    // Costo shown when present, fallback '—' when absent
    expect(screen.getByText('Costo: $9.000')).toBeInTheDocument();
    expect(screen.getByText('Costo: —')).toBeInTheDocument();
  });

  it('shows empty state when no products', () => {
    useSupplierProductsMock.mockReturnValue({ data: [], isLoading: false });

    render(
      <TestWrapper>
        <SupplierDetailDialog
          open={true}
          onOpenChange={() => {}}
          supplier={mockSupplier}
        />
      </TestWrapper>
    );

    expect(
      screen.getByText(/no tiene productos asociados/i),
    ).toBeInTheDocument();
  });
});