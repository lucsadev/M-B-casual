# Tasks: Fase 2 — Carrito + Checkout

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~1010 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (DB+shared) → PR 2 (Cart) → PR 3 (Checkout+confirm) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Migration + shared cart/checkout types | PR 1 | Base=feature/carrito-checkout, ~180 lines, independent |
| 2 | Cart hooks + Web/Mobile Cart UI | PR 2 | Base=PR 1 branch, ~480 lines, depends on PR 1 |
| 3 | Checkout + Order confirmation (web+mobile) | PR 3 | Base=PR 2 branch, ~350 lines, depends on PR 1-2 |

## Phase 1: Foundation (DB + Shared)

- [x] 1.1 `supabase/migrations/00004_cart_checkout.sql` — cart_items table, RLS policies, `create_order_from_cart` RPC
- [x] 1.2 `packages/shared/src/types/cart.ts` — CartItem, ShippingAddress, CartSummary interfaces
- [x] 1.3 `packages/shared/src/validators/checkout.ts` → `validators/cart.ts` — cartItem, shippingAddress, checkout schemas (adapted per PR 1 scope)
- [x] 1.4 `packages/shared/src/constants/shipping.ts` + `constants/payment.ts` — SHIPPING_COST (0), PAYMENT_METHODS
- [x] 1.5 Update shared barrel exports (types/index, validators/index, constants/index)

## Phase 2: Core — Cart + Checkout Hooks

- [x] 2.1 `web/src/features/cart/api/queries.ts` — getCart, addItem, updateQty, removeItem, clearCart
- [x] 2.2 `web/src/features/cart/hooks/use-cart.ts` — useCart, useAddToCart, useUpdateQty, useRemoveItem
- [x] 2.3 `mobile/src/features/cart/api/queries.ts` — parallel cart API for mobile
- [x] 2.4 `mobile/src/features/cart/hooks/use-cart.ts` — parallel cart hooks for mobile
- [x] 2.5 `web/src/features/checkout/api/queries.ts` — createOrder RPC call
- [x] 2.6 `web/src/features/checkout/hooks/useCheckout.ts` — useCheckout mutation + form integration
- [x] 2.7 `mobile/src/features/checkout/api/queries.ts` — parallel checkout API
- [x] 2.8 `mobile/src/features/checkout/hooks/useCheckout.ts` — parallel checkout hook

## Phase 3: Web UI — Cart + Checkout + Confirmation

- [x] 3.1 `web/src/features/cart/components/cart-badge.tsx` — header badge reading query cache
- [x] 3.2 `web/src/features/cart/components/cart-item-row.tsx` — line item with qty stepper + remove btn
- [x] 3.3 `web/src/features/cart/components/cart-sidebar.tsx` — slide-over panel with items + totals
- [x] 3.4 `web/src/features/cart/pages/cart-page.tsx` — full /carrito page
- [x] 3.5 `web/src/features/checkout/pages/checkout-page.tsx` — shipping form + order summary + submit
- [x] 3.6 `web/src/features/checkout/pages/order-confirmation-page.tsx` — /gracias/:orderId success screen
- [x] 3.7 Wire router.tsx — add /checkout, /gracias/:orderId routes
- [x] 3.8 Wire root-layout.tsx — CartBadge + CartSidebar in header
- [x] 3.9 Wire product-detail-page.tsx — "Agregar al carrito" → useAddToCart mutation

## Phase 4: Mobile UI — Cart + Checkout + Confirmation

- [x] 4.1 `mobile/src/features/cart/components/cart-list.tsx` — FlatList with swipe-to-delete (gesture-handler)
- [x] 4.2 `mobile/src/features/cart/components/cart-summary-sheet.tsx` — bottom sheet totals + CTA
- [x] 4.3 Modify `mobile/src/app/(tabs)/carrito.tsx` — wire CartScreen with list + summary
- [x] 4.4 `mobile/src/app/checkout.tsx` — checkout screen with form + summary + submit
- [x] 4.5 `mobile/src/app/orden/[id].tsx` — order confirmation screen with items + status

## Phase 5: Testing

- [ ] 5.1 Unit: CheckoutFormSchema parse tests (valid data, missing fields, bad phone format)
- [ ] 5.2 Unit: computeOrderSummary() given items + shipping → expected subtotal/total
- [ ] 5.3 Integration: cart mutations with mocked Supabase (verify user_id filter sent)
- [ ] 5.4 Integration: create_order RPC on local Supabase (success + stock fail + duplicate blocked)
- [ ] 5.5 E2E: Playwright add-to-cart → sidebar → checkout → confirm → /gracias walkthrough

## Dependency Graph

```
Phase 1 (DB + Shared)
  └── Phase 2 (Cart + Checkout hooks)
        ├── Phase 3 (Web UI: Cart + Checkout + Confirm)
        └── Phase 4 (Mobile UI: Cart + Checkout + Confirm)
              └── Phase 5 (Testing)
```
