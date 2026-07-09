/**
 * Cart feature barrel (mobile) — re-exports hooks, queries, and components.
 *
 * Public API for the mobile cart domain:
 * - Hooks: useCart, useAddToCart, useUpdateQty, useRemoveItem, useCartSummary, useAnonymousCart
 * - Queries: getCart, addItem, updateQty, removeItem, clearCart, mergeLocalCart
 * - Components: CartList, CartSummarySheet
 */

// Hooks
export {
  useCart,
  useAddToCart,
  useUpdateQty,
  useRemoveItem,
  useCartSummary,
  CART_QUERY_KEY,
} from './hooks/use-cart';
export type { UseCartReturn, AddToCartInput } from './hooks/use-cart';
export {
  useAnonymousCart,
  getAnonymousCartItems,
  clearAnonymousCart,
} from './hooks/use-anonymous-cart';

// API queries (for direct use if needed)
export {
  getCart,
  addItem,
  updateQty,
  removeItem,
  clearCart,
  mergeLocalCart,
} from './api/queries';
export type { LocalCartItem } from './api/queries';

// Components
export { CartList } from './components/cart-list';
export { CartSummarySheet } from './components/cart-summary-sheet';