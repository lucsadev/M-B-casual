/**
 * CartContext — Global cart state provider.
 *
 * Provides a thin convenience layer over either the TanStack Query cart hooks
 * (when authenticated) or the anonymous localStorage cart (when not).
 *
 * The context auto-detects auth state via `useAuth()` and switches between
 * server-side and local cart seamlessly. Components that consume this context
 * do not need to know whether the user is logged in.
 */
import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import type { CartItem, CartSummary } from '@mbt/shared';
import { calculateTotal } from '@mbt/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  useCart,
  useAddToCart,
  type UseCartReturn,
  type AddToCartInput,
} from '../hooks/use-cart';
import { useAnonymousCart } from '../hooks/use-anonymous-cart';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface CartContextValue {
  /** Cart items list (reactive) */
  items: CartItem[];
  /** Total number of items (sum of quantities) */
  totalItems: number;
  /** Computed summary (subtotal, shipping, total, count) */
  summary: CartSummary;
  /** Whether the initial cart fetch is loading */
  isLoading: boolean;
  /** Whether the cart fetch failed */
  isError: boolean;
  /** Add an item to the cart (product + optional variant) */
  addToCart: (input: AddToCartInput) => void;
  /** Whether an add-to-cart mutation is in flight */
  isAddingToCart: boolean;
  /** Manually refetch cart data (no-op for anonymous) */
  refetchCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Server cart (authenticated)
  const serverCart: UseCartReturn = useCart();
  // Anonymous cart (not authenticated)
  const anonymousCart = useAnonymousCart();

  const { mutate: addToCartMutation, isPending: isAddingToCart } =
    useAddToCart();

  // Conditionally pick the active cart source
  const items = isAuthenticated ? serverCart.items : anonymousCart.asCartItems;
  const totalItems = isAuthenticated
    ? serverCart.totalItems
    : anonymousCart.totalItems;
  const isLoading = isAuthenticated ? serverCart.isLoading : false;
  const isError = isAuthenticated ? serverCart.isError : false;

  // Compute summary for anonymous cart (server cart already has summary)
  const anonymousSummary: CartSummary = (() => {
    const subtotal = anonymousCart.subtotal;
    const { shipping, total } = calculateTotal(subtotal);
    return {
      subtotal,
      shipping_cost: shipping,
      discount: 0,
      total,
      item_count: totalItems,
    };
  })();

  const summary = isAuthenticated ? serverCart.summary : anonymousSummary;

  const addToCart = useCallback(
    (input: AddToCartInput) => {
      if (isAuthenticated) {
        // Server-side: use TanStack Query mutation
        addToCartMutation(input, {
          onSuccess: () => {
            toast.success('Producto agregado al carrito');
          },
          onError: (err) => {
            toast.error(err.message ?? 'Error al agregar al carrito');
          },
        });
      } else {
        // Anonymous: use localStorage
        anonymousCart.addItem({
          product_id: input.product_id,
          variant_id: input.variant_id,
          quantity: input.quantity,
        });
        toast.success('Producto agregado al carrito');
      }
    },
    [isAuthenticated, addToCartMutation, anonymousCart],
  );

  const refetchCart = useCallback(() => {
    if (isAuthenticated) {
      serverCart.refetch();
    }
    // No-op for anonymous (already reactive)
  }, [isAuthenticated, serverCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        summary,
        isLoading,
        isError,
        addToCart,
        isAddingToCart,
        refetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access cart state from any component inside a CartProvider.
 * Throws if used outside CartProvider.
 */
export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return ctx;
}
