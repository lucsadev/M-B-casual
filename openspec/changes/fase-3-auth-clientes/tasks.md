# Tasks: Fase 3 — Autenticación y Clientes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~820 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (shared + web auth foundation) → PR 2 (profile + cart merge) → PR 3 (mobile parity) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain (PR 1: auth foundation → PR 2: profile + cart merge → PR 3: mobile parity) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared types + Web auth core (context, login, register, guards) | PR 1 | Base=feature/auth-clientes, ~320 lines, independent deliverable |
| 2 | Profile page, cart merge, nav update | PR 2 | Base=PR 1 branch, ~250 lines, depends on PR 1 |
| 3 | Mobile auth screens + wiring | PR 3 | Base=PR 2 branch, ~250 lines, depends on PR 1-2 |

## Phase 1: Foundation — Shared Types

- [x] 1.1 `packages/shared/src/types/customer.ts` — add `ProfileUpdateInput` type (omit id, userId, createdAt)
- [x] 1.2 `packages/shared/src/validators/customer.ts` — add `profileUpdateSchema` with firstName (req), lastName, phone (+54 regex), address
- [x] 1.3 Update shared barrel exports (`types/index.ts`, `validators/index.ts`)

## Phase 2: Core — Web Auth Context + Guards

- [x] 2.1 `packages/web/src/features/auth/context/AuthContext.tsx` — AuthProvider with `onAuthStateChange` listener, expose user/session/loading/login/register/logout
- [x] 2.2 `packages/web/src/features/auth/components/ProtectedRoute.tsx` + `GuestRoute.tsx` — route guards (split from design's AuthGuard.tsx for composability)
- [x] 2.3 `packages/web/src/features/auth/index.ts` — feature barrel
- [x] 2.4 `packages/web/src/app/layouts/root-layout.tsx` — wrap with `<AuthProvider>`; add login/perfil/logout links to nav (conditional on session)
- [x] 2.5 `packages/web/src/app/router.tsx` — add `/login`, `/register`, `/perfil` routes; wrap `/checkout` with `<ProtectedRoute>`

## Phase 3: Core — Web Auth Pages

- [x] 3.1 `packages/web/src/features/auth/hooks/use-login.ts` — `useLogin()` mutation wrapping `supabase.auth.signInWithPassword()` with error parsing
- [x] 3.2 `packages/web/src/features/auth/hooks/use-register.ts` — `useRegister()` mutation wrapping `supabase.auth.signUp()` with name metadata
- [x] 3.3 `packages/web/src/features/auth/pages/LoginPage.tsx` — `/login` form (email + password) with Zod + Supabase error display
- [x] 3.4 `packages/web/src/features/auth/pages/RegisterPage.tsx` — `/register` form (nombre, apellido, email, teléfono, password) → redirect to /login

## Phase 4: Profile + Cart Merge

- [x] 4.1 `packages/web/src/features/customers/hooks/use-profile.ts` — `useProfile()` query + `useUpdateProfile()` mutation on `customers` table (moved from auth/hooks to customers/hooks for domain clarity)
- [x] 4.2 `packages/web/src/features/customers/pages/ProfilePage.tsx` — `/perfil` with editable profile fields + order history list
- [x] 4.3 `packages/web/src/features/cart/api/queries.ts` — add `mergeLocalCart(userId, items[])` UPSERT by (user_id, product_id, variant_id)
- [x] 4.4 `packages/web/src/features/cart/hooks/use-cart.ts` + `use-anonymous-cart.ts` + `AuthContext.tsx` — local cart merge wired into `onAuthStateChange` SIGNED_IN

## Phase 5: Mobile Parity

- [x] 5.1 `packages/mobile/src/features/auth/context/AuthContext.tsx` — same interface as web; Supabase listener + provider
- [x] 5.2 `packages/mobile/src/features/auth/hooks/use-login.ts` + `use-register.ts` + `use-profile.ts`
- [x] 5.3 `packages/mobile/src/features/auth/screens/LoginScreen.tsx` — login form (Expo)
- [x] 5.4 `packages/mobile/src/features/auth/screens/RegisterScreen.tsx` — register form
- [x] 5.5 `packages/mobile/src/features/auth/screens/ProfileScreen.tsx` — profile + order history
- [x] 5.6 `packages/mobile/src/features/auth/index.ts` — barrel
- [x] 5.7 `packages/mobile/src/app/_layout.tsx` — wrap with `<AuthProvider>`
- [x] 5.8 `packages/mobile/src/app/(tabs)/_layout.tsx` — add profile tab icon; cart badge; adaptive perfil tab title
- [x] 5.9 `packages/mobile/src/features/cart/api/queries.ts` — add `mergeLocalCart()`
- [x] 5.10 `packages/mobile/src/features/cart/hooks/use-anonymous-cart.ts` — add anonymous cart + merge wired to AuthContext

## Dependency Graph

```
Phase 1 (Shared types)
  └── Phase 2-3 (Web auth context + guards + pages)
        ├── Phase 4 (Profile + cart merge)
        └── Phase 5 (Mobile parity)
```