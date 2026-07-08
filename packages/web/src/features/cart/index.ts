/**
 * Cart feature barrel — re-exports hooks, queries, context, components, and pages.
 *
 * Public API for the cart domain:
 * - Context: CartProvider, useCartContext
 * - Hooks: useCart, useAddToCart, useUpdateQty, useRemoveItem, useCartSummary, useAnonymousCart
 * - Queries: getCart, addItem, updateQty, removeItem, clearCart, mergeLocalCart
 * - Components: CartBadge, CartItemRow, CartSidebar
 * - Pages: CartPage
 */

// Context
export { CartProvider, useCartContext } from './context/CartContext';
export type { CartContextValue } from './context/CartContext';

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
export { useAnonymousCart, clearAnonymousCart, getAnonymousCartItems } from './hooks/use-anonymous-cart';
export type { AnonymousCartItem } from './hooks/use-anonymous-cart';

// API queries
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
export { CartBadge } from './components/cart-badge';
export { CartItemRow } from './components/cart-item-row';
export { CartSidebar } from './components/cart-sidebar';

// Pages
export { CartPage } from './pages/cart-page';
