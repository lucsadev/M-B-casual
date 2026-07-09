# Specs Summary — Fase 6: Polaco y Deployment

## New Capabilities (Full Specs)

| Domain | Path | Requirements | Scenarios |
|--------|------|-------------|-----------|
| image-optimization-web | `openspec/specs/image-optimization-web/spec.md` | 2 | 4 |
| offline-mode-mobile | `openspec/specs/offline-mode-mobile/spec.md` | 3 | 4 |
| seo-web | `openspec/specs/seo-web/spec.md` | 4 | 6 |
| deployment-vercel | `openspec/specs/deployment-vercel/spec.md` | 3 | 5 |
| deployment-eas | `openspec/specs/deployment-eas/spec.md` | 3 | 5 |
| e2e-testing | `openspec/specs/e2e-testing/spec.md` | 3 | 5 |

## Modified Capabilities (Delta Specs)

| Domain | Path | ADDED | MODIFIED | REMOVED |
|--------|------|-------|----------|---------|
| catalog-display-web | `openspec/changes/.../specs/catalog-display-web/spec.md` | 0 | 1 | 1 |
| mobile-catalog | `openspec/changes/.../specs/mobile-catalog/spec.md` | 1 | 1 | 1 |

## Coverage

- **Happy paths**: All covered — each requirement has at least one happy-path scenario
- **Edge cases**: Covered — browser fallback (WebP), empty cart, invalid login, non-admin access, offline queue
- **Error states**: Covered — broken image fallback, mutation persistence excluded, build versioning, blocked admin access
