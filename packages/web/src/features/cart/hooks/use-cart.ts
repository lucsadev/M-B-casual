/**
 * useCart — TanStack Query hooks for cart operations.
 *
 * Provides:
 * - useCart()        → query with items, totals, and loading state
 * - useAddToCart()   → mutation to add/increment item (optimistic)
 * - useUpdateQty()   → mutation to update quantity (optimistic)
 * - useRemoveItem()  → mutation to remove item (optimistic)
 *
 * All mutations use optimistic updates to make the UI feel instant.
 * On error, the cache reverts to the last successful state.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { CartItem, CartSummary } from '@mbt/shared';
import { calculateTotal } from '@mbt/shared';
import {
  getCart,
  addItem,
  updateQty,
  removeItem,
} from '../api/queries';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const CART_QUERY_KEY = ['cart'] as const;

// ---------------------------------------------------------------------------
// Auth helper — gets current user id from Supabase session
// ---------------------------------------------------------------------------

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

// ---------------------------------------------------------------------------
// useCart — fetch cart items with consumer-friendly return value
// ---------------------------------------------------------------------------

export interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  summary: CartSummary;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch the current user's cart items with computed totals.
 *
 * Returns items, totalItems count, subtotal, and a full CartSummary
 * (subtotal, shipping, total, item_count).
 */
export function useCart(): UseCartReturn {
  const {
    data: rawItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CartItem[]>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const userId = await getUserId();
      return getCart(userId);
    },
    staleTime: 1000 * 30,
  });

  return useMemo(() => {
    const totalItems = rawItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = rawItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const { shipping, total } = calculateTotal(subtotal);
    const summary: CartSummary = {
      subtotal,
      shipping_cost: shipping,
      discount: 0,
      total,
      item_count: totalItems,
    };

    return {
      items: rawItems,
      totalItems,
      subtotal,
      summary,
      isLoading,
      isError,
      error,
      refetch,
    };
  }, [rawItems, isLoading, isError, error, refetch]);
}

// ---------------------------------------------------------------------------
// useAddToCart — add item or increment quantity
// ---------------------------------------------------------------------------

export interface AddToCartInput {
  product_id: string;
  variant_id: string | null;
  quantity?: number;
}

// Context shape for optimistic updates
interface CartContext {
  previousItems: CartItem[];
}

/**
 * Mutation to add an item to the cart (or increment if already present).
 *
 * Optimistic update inserts the item into the cache immediately.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddToCartInput, CartContext>({
    mutationFn: async (input) => {
      const userId = await getUserId();
      await addItem(userId, input);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousItems =
        queryClient.getQueryData<CartItem[]>(CART_QUERY_KEY) ?? [];

      // Optimistic: increment quantity if item exists, else append
      const existingIndex = previousItems.findIndex(
        (i) =>
          i.product_id === input.product_id &&
          i.variant_id === input.variant_id,
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = [...previousItems];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (input.quantity ?? 1),
        };
      } else {
        newItems = [
          ...previousItems,
          {
            id: `optimistic-${Date.now()}`,
            user_id: '',
            product_id: input.product_id,
            variant_id: input.variant_id ?? null,
            quantity: input.quantity ?? 1,
            product_name: '',
            product_slug: '',
            product_image: null,
            variant_label: null,
            unit_price: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      queryClient.setQueryData(CART_QUERY_KEY, newItems);
      return { previousItems };
    },
    onError: (_err, _input, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateQty — change item quantity
// ---------------------------------------------------------------------------

/**
 * Mutation to update the quantity of a specific cart item.
 *
 * Optimistic update updates the quantity in cache immediately.
 */
export function useUpdateQty() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { itemId: string; quantity: number }, CartContext>({
    mutationFn: async ({ itemId, quantity }) => {
      await updateQty(itemId, quantity);
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousItems =
        queryClient.getQueryData<CartItem[]>(CART_QUERY_KEY) ?? [];

      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEY, (old) =>
        (old ?? []).map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        ),
      );

      return { previousItems };
    },
    onError: (_err, _input, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// useRemoveItem — delete cart item
// ---------------------------------------------------------------------------

/**
 * Mutation to remove an item from the cart.
 *
 * Optimistic update removes the item from cache immediately.
 */
export function useRemoveItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, CartContext>({
    mutationFn: async (itemId) => {
      await removeItem(itemId);
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousItems =
        queryClient.getQueryData<CartItem[]>(CART_QUERY_KEY) ?? [];

      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEY, (old) =>
        (old ?? []).filter((item) => item.id !== itemId),
      );

      return { previousItems };
    },
    onError: (_err, _input, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// useCartSummary — computed totals only (reactive)
// ---------------------------------------------------------------------------

/**
 * Reactive hook that returns just the cart summary (subtotal, shipping, total, count).
 * Re-computes whenever the cart query data changes.
 */
export function useCartSummary(): CartSummary {
  const { data = [] } = useQuery<CartItem[]>({
    queryKey: CART_QUERY_KEY,
    enabled: false, // Don't fetch — piggyback on useCart's query
  });

  const totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = data.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const { subtotal: _, shipping, total } = calculateTotal(subtotal);

  return {
    subtotal,
    shipping_cost: shipping,
    discount: 0,
    total,
    item_count: totalItems,
  };
}
