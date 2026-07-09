# Fase 4 — Finanzas: Specs Summary

**Change**: `fase-4-finanzas`

| Domain | Type | Requirements | Scenarios |
|--------|------|-------------|-----------|
| admin-expenses | New | 4 | 7 |
| admin-purchases | New | 4 | 7 |
| admin-finance-dashboard | New | 3 | 6 |
| admin-cash-movements | New | 4 | 7 |
| database-schema | Delta | 2 added | 6 |
| admin-catalog | Delta | 1 modified | 4 (2 unchanged, 2 new) |
| **Total** | — | **18** | **40** |

### Coverage
- Happy paths: covered
- Edge cases: covered (zero amount, empty description, no items, no data, partial months)
- Error states: covered (validation rejections, RLS 403, empty states, concurrent stock)

### Next Step
Ready for design (sdd-design).