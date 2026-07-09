# Fase 0 — Fundación: Specs Summary

**Change**: `fase-0-fundacion`
**Date**: 2026-07-07

## Specs Written

| Domain           | Type | Requirements | Scenarios | Dependencies                   |
| ---------------- | ---- | ------------ | --------- | ------------------------------ |
| monorepo-setup   | New  | 3            | 6         | None                           |
| shared-package   | New  | 4            | 8         | monorepo-setup                 |
| database-schema  | New  | 4            | 8         | supabase-auth (partial)        |
| supabase-auth    | New  | 3            | 6         | database-schema                |
| supabase-storage | New  | 3            | 6         | database-schema, supabase-auth |
| tooling-base     | New  | 5            | 10        | monorepo-setup                 |

## Dependency Graph

```
monorepo-setup
  ├── shared-package
  ├── tooling-base
  └── database-schema ──→ supabase-auth ──→ supabase-storage
```

## Coverage

- Happy paths: Covered — all specs have primary success scenarios
- Edge cases: Covered — duplicate registration, missing directories, invalid data, RLS blocking
- Error states: Covered — foreign key violations, schema validation failures, authorization denial

## Storage

- **OpenSpec**: `openspec/specs/{capability}/spec.md` (6 files)
- **OpenSpec change**: `openspec/changes/fase-0-fundacion/specs.md`
- **Engram**: `sdd/fase-0-fundacion/spec-{capability}` (6 observations) + `sdd/fase-0-fundacion/specs`

## Next Step

Ready for design (sdd-design).
