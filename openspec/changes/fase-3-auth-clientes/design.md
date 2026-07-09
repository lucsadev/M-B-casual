# Design: Fase 3 — Autenticación y Clientes

## Technical Approach

Auth state via Supabase `onAuthStateChange` listener → React context (`AuthContext`). Customer profile (read/write) on `customers` table via TanStack Query. Route guards as a `<ProtectedRoute>` wrapper (web) and layout redirect (mobile). Cart merge hooks that read local state, UPSERT to server, and clear local on login success.

No new backend — RLS policies and `handle_new_user` trigger already exist.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Auth state management | `AuthContext` + Supabase listener | `getSession()` on every page | Listener keeps state reactive across tabs; avoids flash-of-unauthenticated-content |
| Cart merge timing | On `onAuthStateChange` → SIGNED_IN | On login page submit | Single source of truth; works even if session restores from SecureStore |
| Profile form | `react-hook-form` + Zod | Custom controlled form | Existing pattern in checkout; Zod schema exists in `@mbt/shared` |
| Order history | TanStack Query (`useOrders()`) | Separate Zustand store | Reuses existing `orders` query infrastructure; cache key invalidates after checkout |
| Protected route (web) | `<ProtectedRoute>` wrapper | Layout-level redirect | Same pattern as existing `<AdminGuard>`; composable per-route |
| Protected route (mobile) | Layout `_layout.tsx` redirect | Screen-level guard | expo-router layout runs first; avoids flash before` Slot` renders |

## Data Flow

```
1. App boots
   supabase.auth.onAuthStateChange ──► AuthContext
       │ SIGNED_IN: user + session
       │            └── trigger cart merge
       │ SIGNED_OUT: null
       ▼
   Layout / Router reads useAuth()

2. Login flow
   LoginPage
     │ email + password
     ▼
   supabase.auth.signInWithPassword()
     │ onSuccess: onAuthStateChange fires SIGNED_IN
     │            AuthContext updates user
     │            mergeLocalCart() runs UPSERT per item
     │            TanStack Query's cart query refetches
     ▼
   Redirect to checkout (or /perfil)

3. Profile flow
   ProfilePage
     │ useQuery(['customer', userId]) reads customers table
     │ react-hook-form pre-populated with customer data
     │ useUpdateProfile() mutation → supabase.from('customers').upsert()
     ▼
   Hot toast on success / error

4. Cart merge (anonymous → authenticated)
   Local storage ──► mergeCartItems(userId, localItems)
        │
        ▼
   For each local item:
     supabase.from('cart_items').upsert({
       user_id, product_id, variant_id,
       quantity: existing ? existing.qty + local.qty : local.qty
     })
     onConflict: (user_id, product_id, variant_id)
        │
        ▼
   Clear localStorage cart
   Invalidate ['cart'] query → full reload from server

5. Route guard
   Web: router → ProtectedRoute → useAuth().user ? <Outlet/> : <Navigate to="/login"/>
   Mobile: _layout.tsx → useAuth().user ? <Stack/> : <Redirect href="/login"/>
```

## File Changes

### Shared package

| File | Action | Description |
|---|---|---|
| `packages/shared/src/types/customer.ts` | Modify | Add `ProfileUpdateInput` type (omit id, userId, timestamps) |
| `packages/shared/src/validators/customer.ts` | Modify | Add `profileUpdateSchema` (firstName, lastName, phone, address) |
| `packages/shared/src/types/index.ts` | Modify | Re-export `ProfileUpdateInput` |
| `packages/shared/src/validators/index.ts` | Modify | Re-export `profileUpdateSchema` |

### New — Web auth feature

| File | Action | Description |
|---|---|---|
| `packages/web/src/features/auth/context/AuthContext.tsx` | Create | `AuthProvider` + `useAuth()`: user, session, loading, signUp, signIn, signOut |
| `packages/web/src/features/auth/context/AuthGuard.tsx` | Create | `<ProtectedRoute>` redirects to `/login` if `user` is null |
| `packages/web/src/features/auth/hooks/use-login.ts` | Create | `useLogin()` mutation wrapping `supabase.auth.signInWithPassword()` |
| `packages/web/src/features/auth/hooks/use-register.ts` | Create | `useRegister()` mutation wrapping `supabase.auth.signUp()` |
| `packages/web/src/features/auth/hooks/use-profile.ts` | Create | `useProfile()` query + `useUpdateProfile()` mutation |
| `packages/web/src/features/auth/pages/login-page.tsx` | Create | Login form with email + password + error display |
| `packages/web/src/features/auth/pages/register-page.tsx` | Create | Register form: nombre, email, password, confirm |
| `packages/web/src/features/auth/pages/profile-page.tsx` | Create | Editable profile form + order history list |
| `packages/web/src/features/auth/index.ts` | Create | Feature barrel |

### Modified — Web

| File | Action | Description |
|---|---|---|
| `packages/web/src/app/layouts/root-layout.tsx` | Modify | Wrap with `<AuthProvider>`; add login/profile links to header |
| `packages/web/src/app/router.tsx` | Modify | Add `/login`, `/registro`, `/perfil` routes; wrap `/checkout` with `<ProtectedRoute>` |
| `packages/web/src/features/cart/api/queries.ts` | Modify | Add `mergeLocalCart(userId, items[])` upsert function |
| `packages/web/src/features/cart/hooks/use-cart.ts` | Modify | Add `useMergeCart()` hook called from AuthContext on SIGNED_IN |
| `packages/web/src/features/checkout/pages/checkout-page.tsx` | Modify | Add auth check at start: if no user, redirect to login with return URL |

### New — Mobile auth feature

| File | Action | Description |
|---|---|---|
| `packages/mobile/src/features/auth/context/AuthContext.tsx` | Create | Same interface as web — `useAuth()` |
| `packages/mobile/src/features/auth/hooks/use-login.ts` | Create | Login mutation |
| `packages/mobile/src/features/auth/hooks/use-register.ts` | Create | Register mutation |
| `packages/mobile/src/features/auth/hooks/use-profile.ts` | Create | Profile query + mutation |
| `packages/mobile/src/features/auth/screens/login-screen.tsx` | Create | Login screen |
| `packages/mobile/src/features/auth/screens/register-screen.tsx` | Create | Register screen |
| `packages/mobile/src/features/auth/screens/profile-screen.tsx` | Create | Profile + order history |
| `packages/mobile/src/features/auth/index.ts` | Create | Feature barrel |

### Modified — Mobile

| File | Action | Description |
|---|---|---|
| `packages/mobile/src/app/_layout.tsx` | Modify | Wrap with `<AuthProvider>` |
| `packages/mobile/src/app/(tabs)/_layout.tsx` | Modify | Add profile tab icon; redirect to login if unauthenticated on checkout |
| `packages/mobile/src/app/(tabs)/perfil.tsx` | Modify | Replace placeholder with ProfileScreen |
| `packages/mobile/src/features/cart/api/queries.ts` | Modify | Add `mergeLocalCart()` |
| `packages/mobile/src/features/cart/hooks/use-cart.ts` | Modify | Add `useMergeCart()` |
| `packages/mobile/src/app/checkout.tsx` | Modify | Auth guard redirect |

## Interfaces / Contracts

### AuthContext

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### Cart merge (shared pattern)

```typescript
// Added to cart/api/queries.ts
async function mergeLocalCart(
  userId: string,
  localItems: LocalCartItem[]
): Promise<void>;
// Each localItem → upsert by (user_id, product_id, variant_id)
// On conflict: quantity = cart_items.quantity + excluded.quantity
```

### Profile update schema

```typescript
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().optional(),
  phone: z.string().regex(/^(\+54)?\d{7,15}$/, 'Teléfono inválido').optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});
```

## Implementation Order

| Step | What | Why first |
|---|---|---|
| 1 | Shared types: `profileUpdateSchema`, `ProfileUpdateInput` | Prereq for both platforms |
| 2 | Web `AuthContext` + `ProtectedRoute` | Gate everything else |
| 3 | Web login/register pages | Authentication works |
| 4 | Web profile page + order history | Profile CRUD visible |
| 5 | Cart merge logic (web queries + hooks) | Must exist before auth triggers it |
| 6 | Wire merge in AuthContext `onAuthStateChange` | Cart persists through login |
| 7 | Mobile `AuthContext` (same pattern) | Feature parity |
| 8 | Mobile login/register/profile screens | Parity |
| 9 | Mobile cart merge | Parity |
| 10 | Web `root-layout.tsx` nav update (login/profile links) | Polishing |

## Risks

| Risk | Prob. | Mitigation |
|---|---|---|
| Cart merge race (two quick logins) | Baja | Merge runs sequentially via `Promise.all`; UPSERT is atomic |
| Profile form submits while DB trigger hasn't created customer row | Baja | Use `upsert` (not `insert`) so it creates-or-updates |
| Mobile Webview session persistence differs from web (SecureStore vs cookies) | Media | Both use Supabase `persistSession: true`; web uses cookies, mobile uses AsyncStorage |
| No existing `login` or `register` route in web app | Media | New routes added to router; backward-compatible since they didn't exist before |

## Open Questions

- None resolved. Design is fully actionable.

## Migration / Rollout

No data migration required. No feature flag needed. The `customers` table and `handle_new_user` trigger already exist. Rollback: revert all files listed under "New" and "Modified", remove routes `/login`, `/registro`, `/perfil`.