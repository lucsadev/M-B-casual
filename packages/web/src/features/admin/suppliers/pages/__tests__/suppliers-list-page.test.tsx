import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EditSupplierDialog } from '../../components/EditSupplierDialog';
import { SuppliersListPage } from '../SuppliersListPage';
import type { Supplier } from '@mbt/shared';

// Mock all external dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => ({ data: [], count: 0, error: null })),
          })),
        })),
        range: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], count: 0, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock('../../api/use-supplier-mutations', () => ({
  useUpdateSupplier: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteSupplier: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../components/CreateSupplierDialog', () => ({
  CreateSupplierDialog: ({ open, onOpenChange }: any) =>
    open ? (
      <div>
        <button onClick={() => onOpenChange(false)}>Close</button>
        Crear proveedor
      </div>
    ) : null,
}));

vi.mock('../../components/EditSupplierDialog', () => ({
  EditSupplierDialog: ({ open, onOpenChange, initialSupplier }: any) =>
    open ? (
      <div>
        <button onClick={() => onOpenChange(false)}>Close</button>
        Editar proveedor - {initialSupplier?.name}
      </div>
    ) : null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div className="skeleton" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  Edit: () => <span>Edit Icon</span>,
  Plus: () => <span>Plus Icon</span>,
  Trash2: () => <span>Trash2 Icon</span>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('EditSupplierDialog', () => {
  const mockSupplier: Supplier = {
    id: 'test-id-1',
    name: 'Textil Ríos',
    contactName: 'Juan Pérez',
    email: 'ventas@textilrios.com',
    phone: '11 5555 1234',
    address: 'Av. Corrientes 1234, CABA',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('renders with initial supplier data', () => {
    render(
      <TestWrapper>
        <EditSupplierDialog
          open={true}
          onOpenChange={() => {}}
          initialSupplier={mockSupplier}
        />
      </TestWrapper>
    );
    expect(
      screen.getByText('Editar proveedor - Textil Ríos'),
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <EditSupplierDialog open={false} onOpenChange={() => {}} />
      </TestWrapper>
    );
    expect(screen.queryByText(/Editar proveedor/)).not.toBeInTheDocument();
  });
});

describe('SuppliersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header', async () => {
    render(
      <TestWrapper>
        <SuppliersListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Proveedores')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no suppliers', async () => {
    render(
      <TestWrapper>
        <SuppliersListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No hay proveedores todavía/i),
      ).toBeInTheDocument();
    });
  });

  it('opens the create dialog when the New supplier button is clicked', async () => {
    render(
      <TestWrapper>
        <SuppliersListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Proveedores')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nuevo proveedor'));

    expect(screen.getByText('Crear proveedor')).toBeInTheDocument();
  });
});
