# Propuesta: Fase 3 — Autenticación y Clientes

## Intención

Habilitar registro, login y gestión de perfil para clientes web y mobile. Integrar el carrito con autenticación para que usuarios anónimos no pierdan items al registrarse. Proteger rutas sensibles (checkout, perfil) detrás de autenticación.

## Alcance

### Incluye
- Registro de usuario con email/password (web + mobile)
- Login con manejo de errores y persistencia de sesión
- Perfil de cliente: ver/editar datos personales
- Historial de órdenes del usuario autenticado
- Auth guard: checkout y perfil requieren login
- Navbar/layout adaptativo según estado de auth
- Merge de carrito anónimo al hacer login

### Excluye
- OAuth providers (Google, Apple)
- Verificación de email (confirmación)
- Roles de admin — ya existen vía `is_admin()`
- Recuperación de contraseña

## Capacidades

### Nuevas
- `auth-ui-web`: formularios de registro, login y perfil para web
- `auth-ui-mobile`: pantallas de registro, login y perfil para mobile
- `order-history`: listado de órdenes del cliente autenticado

### Modificadas
- `supabase-auth`: agregar login flow, session persistence, profile CRUD, route guard logic
- `cart-web`: agregar carrito anónimo local + merge server al login
- `cart-mobile`: agregar carrito anónimo local + merge server al login
- `checkout-flow`: agregar requisito de autenticación antes de checkout

## Enfoque

- **Web**: feature `auth/` con hooks `useAuth`, `useLogin`, `useRegister`, `useProfile`. React Router guards con `<ProtectedRoute>`. TanStack Query para profile updates.
- **Mobile**: feature `auth/` con expo-router guards en layout. `useAuth` hook compartido. SecureStore para sesión (ya manejado por Supabase).
- **Merge carrito**: al login exitoso, leer carrito local (estado/MMKV), POST a `cart_items` del usuario con UPSERT, limpiar local.
- **Backend**: no requiere cambios — trigger `handle_new_user` ya crea `customers`. RLS policies existentes cubren acceso a órdenes propias.

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `packages/web/src/features/auth/` | Nueva | Registro, login, profile, guards |
| `packages/mobile/src/features/auth/` | Nueva | Registro, login, profile, guards |
| `packages/web/src/features/cart/` | Modificada | Merge anónimo → server |
| `packages/mobile/src/features/cart/` | Modificada | Merge anónimo → server |
| `packages/web/src/app/router.tsx` | Modificada | Auth guards en rutas |
| `packages/mobile/src/app/_layout.tsx` | Modificada | Auth guards en navegación |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Merge conflictivo de carrito (items duplicados) | Media | UPSERT suma cantidades si el item+variant ya existe |
| Sesión expirada durante checkout | Baja | Supabase Auth refresh automático; mostrar error si falla |

## Plan de Rollback

Revert commits de `features/auth/` y cambios en `features/cart/`. Las rutas protegidas vuelven a ser públicas. No hay cambios de backend — solo frontend.

## Dependencias

- Supabase Auth ya configurado (Fase 0)
- Tabla `customers` con trigger `handle_new_user` existente
- Carrito web + mobile implementados (Fase 2)
- Checkout flow implementado (Fase 2)

## Criterios de Éxito

- [ ] Usuario puede registrarse y login con email+password en web y mobile
- [ ] Perfil muestra/edita datos del customer correctamente
- [ ] Checkout redirige a login si no hay sesión
- [ ] Items del carrito anónimo se migran al login sin pérdida
- [ ] Historial de órdenes muestra solo órdenes del usuario autenticado
