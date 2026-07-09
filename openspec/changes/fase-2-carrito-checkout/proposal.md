# Proposal: Fase 2 — Carrito + Checkout

## Intent

Habilitar el flujo completo de compra: agregar productos al carrito desde cualquier página, gestionar items, completar el checkout con datos de envío y método de pago, y confirmar la orden. Sin auth obligatoria aún (Fase 3). Actualmente el catálogo funciona pero no hay forma de comprar.

## Scope

### In Scope
- Carrito web: página `/carrito` + sidebar accesible desde todo el sitio
- Carrito mobile: CartScreen con FlatList, swipe-to-delete, bottom sheet resumen
- Checkout web + mobile: formulario envío, selección pago, resumen, creación de orden
- Persistencia vía TanStack Query + `cart_items` en Supabase
- Página de confirmación con número de orden y detalle

### Out of Scope
- Autenticación obligatoria (se asume usuario anónimo o existente, se completa en Fase 3)
- Pasarela de pagos real (solo selección del método, sin integración MP)
- Gestión de órdenes para admin (Fase 1 lo tiene parcial, se completa después)
- Notificaciones WhatsApp (postergado a fase posterior)
- Offline queue para checkout sin conexión (postergado a Fase 6)

## Capabilities

### New Capabilities
- `cart-web`: UI de carrito web (página + sidebar), manejo de cantidades, cálculo de subtotal/envío/total
- `cart-mobile`: Pantalla CartScreen con FlatList, swipe-to-delete, bottom sheet resumen
- `checkout-flow`: Formulario de envío (react-hook-form + Zod), selección de pago, creación de orden + vaciado de carrito
- `order-confirmation`: Pantalla/página de éxito con número de orden, items, y total

### Modified Capabilities
- `shared-package`: Agregar tipos `CartItem`, `CartActions`, `CheckoutFormData`; agregar esquemas Zod para checkout; exportar constantes `SHIPPING_COST`, `PAYMENT_METHODS`
- `database-schema`: Documentar tabla `cart_items` (ya existe en DB, no cubierta en spec actual) con sus columnas, FKs, y RLS policies

## Approach

Carrito con TanStack Query mutations sobre `cart_items` (CRUD directo con RLS). Checkout usa transacción application-level: insertar orden → insertar order_items → eliminar cart_items del usuario. Hooks de negocio compartidos (`useCart`, `useCheckout`) en `packages/shared` o re-exportados desde cada feature. UI separada por plataforma (web con shadcn/ui sidebar, mobile con react-native-gesture-handler swipe).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/shared/src/types/` | Modified | Add `CartItem`, `CheckoutFormData` types |
| `packages/shared/src/validators/` | Modified | Add Zod schemas for checkout |
| `packages/shared/src/constants/` | Modified | Add `SHIPPING_COST`, `PAYMENT_METHODS` |
| `packages/web/src/features/cart/` | New | Web cart page + sidebar component |
| `packages/web/src/features/checkout/` | New | Web checkout page + form |
| `packages/web/src/features/orders/` | New | Order confirmation page |
| `packages/web/src/app/routes.tsx` | Modified | Add `/carrito`, `/checkout`, `/gracias/:orderId` |
| `packages/mobile/src/features/cart/` | New | Mobile CartScreen + components |
| `packages/mobile/src/features/checkout/` | New | Mobile checkout screen |
| `packages/mobile/src/features/orders/` | New | Order detail screen |
| `supabase/migrations/` | Modified | Migration for cart_items RLS if missing |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `cart_items` table sin RLS policies completas | Med | Verificar policies existentes; agregar migration si faltan |
| Checkout sin auth causa customer_id nulo | Med | Usar `auth.uid()` de Supabase; requerir login si no hay sesión |
| Cálculo de envío hardcodeado | Low | Usar constante `SHIPPING_COST` configurable en shared |

## Rollback Plan

Si algo falla en producción: revertir último migration de cart_items (si se agregó), eliminar rutas nuevas de React Router / Expo Router, volver al tag `fase-1-complete` en git. La tabla `cart_items` existente es segura — solo tiene datos de carrito no confirmados.

## Dependencies

- `cart_items` table ya existe en Supabase (verificar RLS policies)
- `packages/shared` compilado y funcionando desde Fase 1
- React Router / Expo Router configurado desde Fase 1

## Success Criteria

- [ ] Agregar item al carrito desde el detalle de producto → aparece en sidebar web y CartScreen mobile
- [ ] Modificar cantidad y eliminar items → se refleja en Supabase y UI
- [ ] Checkout completa: crear orden + order_items + vaciar carrito en una transacción
- [ ] Confirmación muestra número de orden, items, y total correcto
