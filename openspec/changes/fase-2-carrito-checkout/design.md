# Design: Fase 2 — Carrito + Checkout

## Technical Approach

Flujo completo de compra sobre Supabase directo (sin Edge Functions). Carrito vía TanStack Query mutations sobre `cart_items` con optimistic updates. Checkout atómico mediante RPC de Postgres que envuelve INSERT orden + items + DELETE carrito en una transacción. Auth anónima (Supabase `signInAnonymously`) para persistencia sin registro forzado.

---

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Cart persistence | `cart_items` table + anonymous auth | localStorage | RLS garantiza aislamiento por usuario; anon auth da `auth.uid()` sin registro |
| Checkout atomicity | Postgres RPC function | Edge Function, client-side multi-step | RPC corre dentro de una transacción DB — sin riesgo de orden huérfana |
| State management | TanStack Query mutations | Zustand, Redux | Ya es el patrón del proyecto; cachea, refetch, optimistic updates gratis |
| Shipping form | react-hook-form + Zod | Formik, custom | Patrón estándar del ecosistema; Zod ya está en shared |
| Cart badge count | `queryClient.getQueryData` suscrito | Context global | Sin estado duplicado — el badge lee del cache de TanStack Query |

---

## Data Flow

```
ProductDetailPage
  │ onClick "Agregar"
  ▼
useAddToCart() mutation ──► supabase.from('cart_items').upsert()
  │                              │
  └── optimistic update ─────────┘ (cache se actualiza al instante)
       │
       ▼
    CartBadge (header) reactivo via query cache
    CartSidebar / CartPage leen useCart() query

Checkout flow:
  CheckoutPage
    │ shipping form (react-hook-form + Zod validation)
    │ payment method selection
    ▼
  useCheckout() mutation ──► supabase.rpc('create_order', { ... })
    │                              │
    │                         [BEGIN TRANSACTION]
    │                           INSERT orders
    │                           INSERT order_items (from cart)
    │                           DELETE cart_items WHERE user_id
    │                         [COMMIT]
    ▼
  OrderConfirmationPage (orderId from response)
```

---

## File Changes

### New — Database

| File | Action | Description |
|---|---|---|
| `supabase/migrations/00004_cart_items_and_checkout.sql` | Create | `cart_items` table, RLS policies, `create_order` RPC function |

### New — Shared Package

| File | Action | Description |
|---|---|---|
| `packages/shared/src/types/cart.ts` | Create | `CartItem`, `CartActions`, `CheckoutFormData`, `OrderSummary` types |
| `packages/shared/src/validators/checkout.ts` | Create | `CheckoutFormSchema` Zod schema |
| `packages/shared/src/constants/cart.ts` | Create | `SHIPPING_COST`, checkout-related constants |
| `packages/shared/src/types/index.ts` | Modify | Re-export new cart/checkout types |
| `packages/shared/src/validators/index.ts` | Modify | Re-export `CheckoutFormSchema` |
| `packages/shared/src/constants/index.ts` | Modify | Re-export `SHIPPING_COST` |

### New — Web

| File | Action | Description |
|---|---|---|
| `packages/web/src/features/cart/api/queries.ts` | Create | `getCart`, `addItem`, `updateQty`, `removeItem`, `clearCart` Supabase calls |
| `packages/web/src/features/cart/hooks/use-cart.ts` | Create | `useCart()` query + `useAddToCart()`, `useUpdateQty()`, `useRemoveItem()` mutations |
| `packages/web/src/features/cart/components/cart-sidebar.tsx` | Create | Slide-over sidebar panel with items list |
| `packages/web/src/features/cart/components/cart-item-row.tsx` | Create | Line item with quantity stepper + remove |
| `packages/web/src/features/cart/components/cart-badge.tsx` | Create | Header badge showing item count |
| `packages/web/src/features/cart/pages/cart-page.tsx` | Create | Full `/carrito` page with editable list + totals |
| `packages/web/src/features/cart/index.ts` | Create | Feature barrel |
| `packages/web/src/features/checkout/api/queries.ts` | Create | `createOrder` RPC call |
| `packages/web/src/features/checkout/hooks/use-checkout.ts` | Create | `useCheckout()` mutation + form integration |
| `packages/web/src/features/checkout/pages/checkout-page.tsx` | Create | `/checkout` page: form + summary + submit |
| `packages/web/src/features/checkout/index.ts` | Create | Feature barrel |
| `packages/web/src/features/orders/pages/order-confirmation-page.tsx` | Create | `/gracias/:orderId` success page |
| `packages/web/src/app/pages/cart.tsx` | Modify | Remove placeholder, delegate to feature |
| `packages/web/src/app/pages/checkout.tsx` | Create | Route wrapper → feature page |
| `packages/web/src/app/pages/order-confirmation.tsx` | Create | Route wrapper → feature page |
| `packages/web/src/app/router.tsx` | Modify | Add `/checkout`, `/gracias/:orderId` routes |
| `packages/web/src/app/layouts/root-layout.tsx` | Modify | Add CartBadge + CartSidebar integration |
| `packages/web/src/features/catalog/pages/product-detail-page.tsx` | Modify | Wire "Agregar al carrito" button to `useAddToCart()` |

### New — Mobile

| File | Action | Description |
|---|---|---|
| `packages/mobile/src/features/cart/api/queries.ts` | Create | Cart API (parallels web) |
| `packages/mobile/src/features/cart/hooks/use-cart.ts` | Create | Same interface as web hook |
| `packages/mobile/src/features/cart/components/cart-list.tsx` | Create | FlatList with swipe-to-delete |
| `packages/mobile/src/features/cart/components/cart-summary-sheet.tsx` | Create | Bottom sheet with totals |
| `packages/mobile/src/features/cart/index.ts` | Create | Feature barrel |
| `packages/mobile/src/features/checkout/api/queries.ts` | Create | Checkout API |
| `packages/mobile/src/features/checkout/hooks/use-checkout.ts` | Create | Checkout hook |
| `packages/mobile/src/features/checkout/index.ts` | Create | Feature barrel |
| `packages/mobile/src/app/(tabs)/carrito.tsx` | Modify | Replace placeholder with full CartScreen |
| `packages/mobile/src/app/checkout.tsx` | Create | Checkout screen route |
| `packages/mobile/src/app/orden/[id].tsx` | Create | Order confirmation route |

---

## Interfaces / Contracts

### CartItem (shared)

```typescript
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  // Joined fields (from query, not DB):
  productName?: string;
  productPrice?: number;
  productImage?: string;
  variantSize?: string;
  variantColor?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CheckoutFormSchema (shared/Zod)

```typescript
export const CheckoutFormSchema = z.object({
  fullName: z.string().min(3, 'Nombre requerido (mín. 3 caracteres)'),
  address: z.string().min(10, 'Dirección muy corta'),
  phone: z.string().regex(/^(\+54)?\d{7,15}$/, 'Formato telefónico AR'),
  paymentMethod: z.enum(['transferencia', 'efectivo', 'mp']),
});
```

### Checkout RPC (Postgres)

```sql
-- Returns order_id on success, raises exception on failure
create or replace function create_order(
  p_customer_id uuid,
  p_shipping_address jsonb,
  p_payment_method text,
  p_shipping_cost numeric
) returns uuid
language plpgsql security definer
```

### Hook API

```
useCart()           → { items, totalItems, subtotal, summary, isLoading }
useAddToCart()      → { mutate, isPending }
useUpdateQty()      → { mutate, isPending }   // optimistic
useRemoveItem()     → { mutate, isPending }    // optimistic
useCheckout()       → { mutate, isPending, data: orderId }
```

---

## Implementation Order

| Step | What | Why first |
|---|---|---|
| 1 | Migration `00004`: cart_items table, RLS, `create_order` RPC | Prerrequisito DB |
| 2 | Shared package: types, validators, constants | Prerrequisito tipos |
| 3 | Cart API + hooks (shared pattern, web + mobile) | Base funcional |
| 4 | Web cart sidebar + badge + page | Porque la UI consume hooks |
| 5 | Wire "Agregar al carrito" en ProductDetailPage | Hito: primer item en carrito |
| 6 | Mobile: CartScreen + swipe-to-delete | Feature parity |
| 7 | Checkout API + hooks | Siguiente paso lógico |
| 8 | Web checkout page | Completar ciclo web |
| 9 | Mobile checkout screen | Completar ciclo mobile |
| 10 | Order confirmation (web + mobile) | Final del flujo |

---

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | `CartItem` types, `CheckoutFormSchema` | Zod parse tests, type compile checks |
| Unit | `computeOrderSummary()` | Pure function: given items → expected totals |
| Integration | Cart mutations | Mock Supabase client, verify RLS filter sends `user_id` |
| Integration | Checkout RPC | Run against local Supabase: insert succeeds, duplicate blocked |
| E2E | Add → cart → checkout → confirm | Playwright (web) + Detox (mobile) on CI |

---

## Risks

| Risk | Mitigation |
|---|---|
| `cart_items` table no existe (proposal incorrecta) | Migration `00004` la crea desde cero |
| Checkout sin auth → `customer_id` nulo | Usar `auth.uid()`; requerir login o anon auth |
| Optimistic update conflict si quantity < 1 | Validar en mutation `fn` y en el RLS (`CHECK (quantity > 0)`) |
| RPC `create_order` sin validación de stock | Agregar `CHECK` en RPC; lanzar exception si stock insuficiente |

---

## Migration / Rollout

No migration de datos requerida. Feature flag no necesaria — el carrito no existía antes, así que no hay estado legacy que migrar.

Rollback: revertir migration `00004`, eliminar rutas nuevas (`/checkout`, `/gracias/:orderId`), restaurar placeholders de carrito.

---

## Open Questions

- [ ] Shipping cost `SHIPPING_COST`: definir si es flat rate 0 (retiro/local) o valor fijo
- [ ] Stock validation en checkout: ¿permitir over-sell o bloquear si stock < quantity?
