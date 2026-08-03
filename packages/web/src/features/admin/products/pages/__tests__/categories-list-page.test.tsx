import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EditCategoryDialog } from '../../components/EditCategoryDialog';
import { CategoriesListPage } from '../CategoriesListPage';
import type { Category } from '@mbt/shared';

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

vi.mock('../../api/use-category-mutations', () => ({
  useUpdateCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../components/CreateCategoryDialog', () => ({
  CreateCategoryDialog: ({ open, onOpenChange }: any) =>
    open ? (
      <div>
        <button onClick={() => onOpenChange(false)}>Close</button>
        Crear categoría
      </div>
    ) : null,
}));

vi.mock('../../components/EditCategoryDialog', () => ({
  EditCategoryDialog: ({ open, onOpenChange, initialCategory }: any) =>
    open ? (
      <div>
        <button onClick={() => onOpenChange(false)}>Close</button>
        Editar categoría - {initialCategory?.name}
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

vi.mock('@/components/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
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

describe('EditCategoryDialog', () => {
  const mockCategory: Category = {
    id: 'test-id-1',
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test description',
    imageUrl: 'https://example.com/image.jpg',
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('renders with initial category data', () => {
    render(
      <TestWrapper>
        <EditCategoryDialog
          open={true}
          onOpenChange={() => {}}
          initialCategory={mockCategory}
        />
      </TestWrapper>
    );
    expect(screen.getByText('Editar categoría - Test Category')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <EditCategoryDialog open={false} onOpenChange={() => {}} />
      </TestWrapper>
    );
    expect(screen.queryByText(/Editar categoría/)).not.toBeInTheDocument();
  });
});

describe('CategoriesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header', async () => {
    render(
      <TestWrapper>
        <CategoriesListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Categorías')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no categories', async () => {
    render(
      <TestWrapper>
        <CategoriesListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No hay categorías todavía/i),
      ).toBeInTheDocument();
    });
  });

  it('opens the create dialog when the New category button is clicked', async () => {
    render(
      <TestWrapper>
        <CategoriesListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Categorías')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nueva categoría'));

    expect(screen.getByText('Crear categoría')).toBeInTheDocument();
  });
});
