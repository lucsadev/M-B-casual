/**
 * Anonymous cart — local storage cart for unauthenticated users (mobile).
 *
 * Uses AsyncStorage for persisting anonymous cart items.
 * When the user logs in, mergeLocalCart promotes these items to the server-side cart
 * and clears the local store.
 *
 * Mirrors the web pattern in packages/web/src/features/cart/hooks/use-anonymous-cart.ts.
 * The web version uses localStorage; mobile uses AsyncStorage.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalCartItem } from '../api/queries';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const ANONYMOUS_CART_KEY = 'anonymous_cart';

// ---------------------------------------------------------------------------
// Direct storage helpers (for use outside React components, e.g. AuthContext)
// ---------------------------------------------------------------------------

/**
 * Read anonymous cart items from AsyncStorage.
 * Safe to call outside React rendering (e.g., in auth listener).
 */
export async function getAnonymousCartItems(): Promise<LocalCartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ANONYMOUS_CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalCartItem[];
  } catch {
    return [];
  }
}

/**
 * Overwrite anonymous cart items in AsyncStorage.
 */
export async function setAnonymousCartItems(
  items: LocalCartItem[],
): Promise<void> {
  await AsyncStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(items));
}

/**
 * Clear the anonymous cart from storage.
 * Called after successful merge on login.
 */
export async function clearAnonymousCart(): Promise<void> {
  await AsyncStorage.removeItem(ANONYMOUS_CART_KEY);
}

// ---------------------------------------------------------------------------
// React hook (used by UI components)
// ---------------------------------------------------------------------------

/**
 * useAnonymousCart — hook for interacting with the anonymous local cart.
 *
 * Returns the current anonymous items plus actions to add, remove, and clear.
 * Once the user logs in, these items are merged and cleared via AuthContext.
 */
export function useAnonymousCart() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    getAnonymousCartItems().then((stored) => {
      setItems(stored);
      setIsLoaded(true);
    });
  }, []);

  // Persist to AsyncStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(
    (input: {
      product_id: string;
      variant_id: string | null;
      quantity?: number;
      product_name: string;
      unit_price: number;
      product_image: string | null;
    }) => {
      const qty = input.quantity ?? 1;
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) =>
            i.product_id === input.product_id &&
            i.variant_id === input.variant_id,
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + qty,
          };
          return updated;
        }

        return [
          ...prev,
          {
            product_id: input.product_id,
            variant_id: input.variant_id,
            quantity: qty,
            product_name: input.product_name,
            unit_price: input.unit_price,
            product_image: input.product_image,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (product_id: string, variant_id: string | null) => {
      setItems((prev) =>
        prev.filter(
          (i) => i.product_id !== product_id || i.variant_id !== variant_id,
        ),
      );
    },
    [],
  );

  const updateQty = useCallback(
    (product_id: string, variant_id: string | null, quantity: number) => {
      if (quantity <= 0) {
        removeItem(product_id, variant_id);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === product_id && i.variant_id === variant_id
            ? { ...i, quantity }
            : i,
        ),
      );
    },
    [removeItem],
  );

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    totalItems,
    addItem,
    removeItem,
    updateQty,
    clear,
    isLoaded,
  };
}