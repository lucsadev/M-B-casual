/**
 * Tests for admin finance hooks.
 *
 * Mocks the Supabase client (@/lib/supabase) to return controlled data
 * for all query and mutation hooks without requiring a real database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useExpenses,
  usePurchases,
  useCashMovements,
  useCashSummary,
  useCreateExpense,
  useCreateCashMovement,
} from '../use-finance-queries';

// -----------------------------------------------------------------------
// Mock @/lib/supabase — vi.hoisted evita el hoisting issue de vi.mock
// -----------------------------------------------------------------------

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  },
}));

// -----------------------------------------------------------------------
// Helper: crear un builder thenable que simula la cadena de Supabase
// -----------------------------------------------------------------------

interface ChainableMock {
  eq: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  then: ((resolve: (value: unknown) => unknown) => Promise<unknown>) | undefined;
}

/**
 * Crea un objeto que simula la cadena del query builder de Supabase.
 * - Todos los métodos de cadena (.eq, .range, .order, etc.) devuelven el mismo objeto
 * - .select() devuelve un nuevo builder thenable (con .then y los mismos métodos)
 * - El builder es thenable: cuando se await, resuelve con `result`
 */
function createBuilder(result: unknown): ChainableMock {
  // Creamos un thenable: un objeto con .then() que resuelve con `result`
  const thenable: ChainableMock = {
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };

  // El builder inicial (from() devuelve uno con .select)
  const fromBuilder: ChainableMock = {
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnValue(thenable),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: undefined, // El from builder NO es thenable
  };

  // Hacemos que each chain method del thenable devuelva el mismo thenable
  // para que la cadena funcione: .eq().range().order()
  for (const key of ['eq', 'range', 'order', 'limit', 'in'] as const) {
    thenable[key] = vi.fn().mockReturnValue(thenable);
  }

  return fromBuilder;
}

// -----------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// Mock data
// -----------------------------------------------------------------------

const mockExpenses = [
  {
    id: 'e1',
    description: 'Insumos packaging',
    amount: 15000,
    category: 'packaging',
    expense_date: '2026-06-15',
    receipt_url: null,
    created_by: null,
    created_at: '2026-06-15T12:00:00Z',
  },
  {
    id: 'e2',
    description: 'Publicidad Instagram',
    amount: 25000,
    category: 'publicidad',
    expense_date: '2026-06-14',
    receipt_url: null,
    created_by: null,
    created_at: '2026-06-14T12:00:00Z',
  },
];

const mockPurchases = [
  {
    id: 'p1',
    supplier_name: 'Proveedor A',
    invoice_number: '0001-000001',
    total: 100000,
    notes: null,
    purchase_date: '2026-06-10',
    created_at: '2026-06-10T12:00:00Z',
  },
];

const mockCashMovements = [
  {
    id: 'c1',
    type: 'income',
    amount: 50000,
    description: 'Venta #1234',
    reference_type: 'order',
    reference_id: 'o1',
    movement_date: '2026-06-15',
    created_by: null,
    created_at: '2026-06-15T12:00:00Z',
  },
  {
    id: 'c2',
    type: 'expense',
    amount: 15000,
    description: 'Gasto: Insumos packaging',
    reference_type: 'expense',
    reference_id: 'e1',
    movement_date: '2026-06-15',
    created_by: null,
    created_at: '2026-06-15T12:00:00Z',
  },
];

// -----------------------------------------------------------------------
// Tests: useExpenses
// -----------------------------------------------------------------------

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches expenses with pagination', async () => {
    const builder = createBuilder({
      data: mockExpenses,
      error: null,
      count: 2,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(
      () => useExpenses({ page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.total).toBe(2);
    expect(result.current.data?.page).toBe(1);
    expect(mockFrom).toHaveBeenCalledWith('expenses');
  });

  it('filters expenses by category', async () => {
    const builder = createBuilder({
      data: [mockExpenses[0]],
      error: null,
      count: 1,
    });

    mockFrom.mockReturnValue(builder);

    // El builder thenable es el que recibe .eq()
    const thenable = builder.select();

    renderHook(
      () => useExpenses({ category: 'packaging', page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(thenable.eq).toHaveBeenCalledWith('category', 'packaging');
    });
  });

  it('returns loading state initially', async () => {
    const neverResolve = {} as any;
    const builder = createBuilder(neverResolve);

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(
      () => useExpenses({ page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    // No hacemos await porque la promesa nunca resuelve
    expect(result.current.isLoading).toBe(true);
  });

  it('propagates errors from Supabase', async () => {
    const builder = createBuilder({
      data: null,
      error: new Error('Database error'),
      count: null,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(
      () => useExpenses({ page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns empty array when no expenses exist', async () => {
    const builder = createBuilder({
      data: [],
      error: null,
      count: 0,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(
      () => useExpenses({ page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });
});

// -----------------------------------------------------------------------
// Tests: usePurchases
// -----------------------------------------------------------------------

describe('usePurchases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches purchases with pagination', async () => {
    const builder = createBuilder({
      data: mockPurchases,
      error: null,
      count: 1,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => usePurchases(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.total).toBe(1);
    expect(mockFrom).toHaveBeenCalledWith('purchases');
  });

  it('returns loading state initially', async () => {
    const builder = { select: vi.fn().mockReturnValue(new Promise(() => {})) };
    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => usePurchases(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('propagates errors from Supabase', async () => {
    const builder = createBuilder({
      data: null,
      error: new Error('Database error'),
      count: null,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => usePurchases(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// -----------------------------------------------------------------------
// Tests: useCashMovements
// -----------------------------------------------------------------------

describe('useCashMovements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches cash movements with pagination', async () => {
    const builder = createBuilder({
      data: mockCashMovements,
      error: null,
      count: 2,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(
      () => useCashMovements({ page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.total).toBe(2);
    expect(mockFrom).toHaveBeenCalledWith('cash_movements');
  });

  it('filters by type when income filter is set', async () => {
    const builder = createBuilder({
      data: [mockCashMovements[0]],
      error: null,
      count: 1,
    });

    mockFrom.mockReturnValue(builder);

    const thenable = builder.select();

    renderHook(
      () => useCashMovements({ type: 'income', page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(thenable.eq).toHaveBeenCalledWith('type', 'income');
    });
  });

  it('does not filter by type when no filter is specified', async () => {
    const builder = createBuilder({
      data: mockCashMovements,
      error: null,
      count: 2,
    });

    mockFrom.mockReturnValue(builder);

    const thenable = builder.select();

    renderHook(
      () => useCashMovements({ page: 1, pageSize: 25 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(thenable.eq).not.toHaveBeenCalledWith('type', expect.anything());
    });
  });
});

// -----------------------------------------------------------------------
// Tests: useCashSummary
// -----------------------------------------------------------------------

describe('useCashSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates total income and expenses from cash movements', async () => {
    const builder = createBuilder({
      data: mockCashMovements,
      error: null,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => useCashSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total_income: 50000,
      total_expense: 15000,
      balance: 35000,
    });
    expect(mockFrom).toHaveBeenCalledWith('cash_movements');
  });

  it('returns zero balance when no movements exist', async () => {
    const builder = createBuilder({
      data: [],
      error: null,
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => useCashSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total_income: 0,
      total_expense: 0,
      balance: 0,
    });
  });

  it('propagates errors from Supabase', async () => {
    const builder = createBuilder({
      data: null,
      error: new Error('Database error'),
    });

    mockFrom.mockReturnValue(builder);

    const { result } = renderHook(() => useCashSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// -----------------------------------------------------------------------
// Tests: useCreateExpense
// -----------------------------------------------------------------------

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an expense successfully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      description: 'Nuevo gasto',
      amount: 5000,
      category: 'varios',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('expenses');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Nuevo gasto',
        amount: 5000,
        category: 'varios',
        created_by: 'user-1',
      }),
    );
  });

  it('handles create error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValue({
      error: new Error('Insert failed'),
    });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      description: 'Gasto fallido',
      amount: 1000,
      category: 'varios',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// -----------------------------------------------------------------------
// Tests: useCreateCashMovement
// -----------------------------------------------------------------------

describe('useCreateCashMovement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a cash movement successfully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateCashMovement(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      type: 'income',
      amount: 30000,
      description: 'Pago de orden #1234',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('cash_movements');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'income',
        amount: 30000,
        description: 'Pago de orden #1234',
        created_by: 'user-1',
      }),
    );
  });

  it('handles create error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValue({
      error: new Error('Database error'),
    });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateCashMovement(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      type: 'expense',
      amount: 5000,
      description: 'Gasto de prueba',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
