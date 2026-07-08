/**
 * Checkout feature barrel — re-exports hooks, queries, components, and pages.
 *
 * Public API for the checkout domain:
 * - Hooks: useCheckout
 * - Queries: createOrder
 * - Components: ShippingForm, PaymentMethodSelector, OrderSummary
 * - Pages: CheckoutPage, OrderConfirmationPage
 */

// Hooks
export { useCheckout } from './hooks/useCheckout';

// API queries
export { createOrder } from './api/queries';

// Components
export { ShippingForm } from './components/shipping-form';
export { PaymentMethodSelector } from './components/payment-method-selector';
export { OrderSummary } from './components/order-summary';

// Pages
export { CheckoutPage } from './pages/checkout-page';
export { OrderConfirmationPage } from './pages/order-confirmation-page';
