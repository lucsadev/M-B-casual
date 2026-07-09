# Fase 3: Autenticación y Clientes — Specs Summary

## Overview
5 specs covering auth UI (web + mobile), customer profile with order history, route guards, and anonymous cart merge into authenticated carts.

## Specs

| Capability | Type | Reqs | Scenarios |
|-----------|------|------|-----------|
| auth-ui-web | Full | 2 | 6 |
| auth-ui-mobile | Full | 2 | 5 |
| customer-profile | Full | 3 | 6 |
| auth-guard | Full | 3 | 4 |
| cart-merge | Delta (1 MODIFIED, 2 ADDED) | 3 | 6 |

**Total**: 12 requirements, 27 scenarios across 5 specs.

## Coverage

- **Happy paths**: covered (login, register, profile load, merge success)
- **Edge cases**: covered (duplicate email, empty order history, empty local cart, network error during merge)
- **Error states**: covered (invalid credentials, Zod validation, network error, duplicate email)

## Dependencies

- `supabase-auth` — existing spec provides sign-up, RLS, trigger
- `cart-web` / `cart-mobile` — modified by cart-merge delta
- `checkout-flow` — guarded by auth-guard

## Next Step

Ready for design (sdd-design).
