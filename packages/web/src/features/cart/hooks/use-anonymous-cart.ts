/**
 * useAnonymousCart — LocalStorage-based cart for non-authenticated users.
 *
 * Provides get/set/add/clear operations for anonymous cart items stored
 * in localStorage under the key `cart_items_local`.
 *
 * Cart operations work entirely offline — no API calls to Supabase.
 * The cart is merged into the server when the user logs in (see AuthContext).
 *
 * Format of stored items:
 * ```
 * Array<{
 *   product_id: string;
 *   variant_id: string | null;
 *   quantity: number;
 *   product_name: string;
 *   unit_price: number;
 *   product_image: string | null;
 * }>
 * ```
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { CartItem } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'cart_items_local';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnonymousCartItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product_name: string;
  unit_price: number;
  product_image: string | null;
}

// ---------------------------------------------------------------------------
// Vanilla localStorage helpers (used outside React as well)
// ---------------------------------------------------------------------------

/**
 * Cached parse of localStorage — returns the same array reference when
 * the stored data hasn't changed, preventing unnecessary re-renders from
 * useSyncExternalStore seeing a new reference each render.
 */
let cachedParse: AnonymousCartItem[] | null = null;
let cachedRaw: string | null = null;

function read(): AnonymousCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw && cachedParse !== null) {
      return cachedParse;
    }
    const parsed = raw ? (JSON.parse(raw) as AnonymousCartItem[]) : [];
    cachedRaw = raw;
    cachedParse = parsed;
    return parsed;
  } catch {
    cachedRaw = null;
    cachedParse = null;
    return [];
  }
}

function invalidateCache(): void {
  cachedRaw = null;
  cachedParse = null;
}

function write(items: AnonymousCartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  invalidateCache();
}

export function clearAnonymousCart(): void {
  localStorage.removeItem(STORAGE_KEY);
  invalidateCache();
}

export function getAnonymousCartItems(): AnonymousCartItem[] {
  return read();
}

// ---------------------------------------------------------------------------
// Storage event subscription for cross-tab sync
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

function subscribeToStorage(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// Listen for storage events from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) notifyListeners();
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Reactive hook for the anonymous local cart.
 *
 * Uses useSyncExternalStore so the component re-renders when localStorage
 * changes (within the same tab or from another tab).
 *
 * @example
 * const { items, addItem, clear, totalItems } = useAnonymousCart();
 */
export function useAnonymousCart() {
  const items = useSyncExternalStore(subscribeToStorage, read, read);

  const addItem = useCallback(
    (input: {
      product_id: string;
      variant_id: string | null;
      quantity?: number;
      product_name?: string;
      unit_price?: number;
      product_image?: string | null;
    }) => {
      const current = read();
      const qty = input.quantity ?? 1;
      const existingIndex = current.findIndex(
        (i) =>
          i.product_id === input.product_id &&
          i.variant_id === input.variant_id,
      );

      if (existingIndex >= 0) {
        current[existingIndex].quantity += qty;
      } else {
        current.push({
          product_id: input.product_id,
          variant_id: input.variant_id ?? null,
          quantity: qty,
          product_name: input.product_name ?? '',
          unit_price: input.unit_price ?? 0,
          product_image: input.product_image ?? null,
        });
      }

      write(current);
      notifyListeners();
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, variantId: string | null) => {
      const current = read().filter(
        (i) => !(i.product_id === productId && i.variant_id === variantId),
      );
      write(current);
      notifyListeners();
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      const current = read();
      const idx = current.findIndex(
        (i) => i.product_id === productId && i.variant_id === variantId,
      );
      if (idx >= 0) {
        current[idx].quantity = quantity;
        write(current);
        notifyListeners();
      }
    },
    [removeItem],
  );

  const clear = useCallback(() => {
    clearAnonymousCart();
    notifyListeners();
  }, []);

  return useMemo(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0,
    );

    /**
     * Map anonymous items to CartItem shape for compatibility with UI components.
     */
    const asCartItems: CartItem[] = items.map((item, idx) => ({
      id: `local-${idx}`,
      user_id: '',
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      product_name: item.product_name,
      product_slug: '',
      product_image: item.product_image,
      variant_label: null,
      unit_price: item.unit_price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return {
      items,
      asCartItems,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    };
  }, [items, addItem, removeItem, updateQuantity, clear]);
}
