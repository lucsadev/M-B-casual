# Proposal: Fase 6 — Polaco y Deployment

## Intent

Completar el pulido final de la aplicación para producción: optimizar imágenes y SEO en web, agregar modo offline en mobile, preparar deploys a Vercel y EAS Build, y cubrir los flujos críticos con testing E2E.

## Scope

### In Scope
- Optimización de imágenes (WebP, lazy loading, skeleton placeholders) — web
- Offline mode con TanStack Query persist + MMKV + NetInfo — mobile
- SEO dinámico con `react-helmet-async` + Open Graph + sitemap + robots.txt — web
- Deploy config: Vercel (`vercel.json`, build check) + script
- EAS Build config: deep linking schemes, production build — mobile
- Testing E2E: catálogo→checkout, login→perfil→órdenes, admin→clientes→órdenes

### Out of Scope
- CI/CD pipelines (GitHub Actions) — postergado
- Test de carga / performance — postergado
- Publicación real en App Store / Play Store — solo preparación de build
- WhatsApp / Instagram integrations — no son parte de esta fase

## Capabilities

### New Capabilities
- `image-optimization-web`: WebP auto-generation, lazy loading, blur/skeleton placeholders
- `offline-mode-mobile`: TanStack Query persist + MMKV cache + NetInfo connectivity indicator
- `seo-web`: Dynamic meta tags, Open Graph, sitemap.xml, robots.txt
- `deployment-vercel`: vercel.json SPA fallback, build script, build verification
- `deployment-eas`: app.json deep linking schemes, production build verification
- `e2e-testing`: E2E tests for critical user flows (catalog, checkout, auth, admin)

### Modified Capabilities
- `catalog-display-web`: SEO meta tags requirement upgraded to full `react-helmet-async` with Open Graph per page — delta spec
- `mobile-catalog`: Offline cache requirement upgraded to full connectivity detection + offline badge — delta spec

## Approach

Six parallel workstreams with shared dependencies:
1. **Images**: Vite plugin `vite-plugin-imagemin` or manual WebP pipeline + React lazy loading component
2. **Offline**: `@tanstack/query-persist-client-core` + `react-native-mmkv` adapter + `@react-native-community/netinfo`
3. **SEO**: `react-helmet-async` provider wrapping RouterProvider + dynamic tags per route
4. **Deploy web**: `vercel.json` with SPA fallback, verify `vite build` output, add `deploy:vercel` script
5. **Deploy mobile**: Update `app.json` with deep link schemes, run `eas build -p all --profile production` in dry-run
6. **E2E**: Playwright (web) + Detox or Maestro (mobile) covering the 3 critical paths

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/web/vite.config.ts` | Modified | Add imagemin plugin |
| `packages/web/src/main.tsx` | Modified | Wrap with HelmetProvider |
| `packages/web/index.html` | Modified | Base meta + robots.txt link |
| `packages/web/public/robots.txt` | New | robots.txt |
| `packages/web/public/sitemap.xml` | New | sitemap.xml |
| `packages/web/vercel.json` | New | SPA fallback config |
| `packages/web/src/app/router.tsx` | Modified | Remove static meta tags |
| `packages/web/src/components/` | New | LazyImage component |
| `packages/mobile/src/lib/query-client.ts` | Modified | Add persist config |
| `packages/mobile/app.json` | Modified | Deep link schemes |
| `packages/mobile/src/features/catalog/` | Modified | Offline badge + NetInfo |
| `packages/mobile/eas.json` | New | EAS Build profiles |
| `packages/web/e2e/` | New | E2E test files |
| `packages/mobile/e2e/` | New | Mobile E2E test files |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Offline cache invalidation wrong | Medium | Use TanStack Query `gcTime` + manual version key |
| E2E flaky on CI (no real CI yet) | Medium | Start with local-only tests, CI postergado |
| WebP not supported on old browsers | Low | Keep original images as fallback via `<picture>` tag |
| EAS Build credentials not configured | Medium | Document setup steps in deploy guide |

## Rollback Plan

- **Images**: Remove `vite-plugin-imagemin` from vite config, revert LazyImage component
- **Offline**: Remove persist adapter from query-client, revert NetInfo hooks — cache falls back to default in-memory
- **SEO**: Remove HelmetProvider and `react-helmet-async` — tags revert to static index.html
- **Deploy**: Revert `vercel.json` / `app.json` changes — previous state is git-committed
- **E2E**: Delete `e2e/` directories — no production impact since tests run locally

## Dependencies

- `vite-plugin-imagemin` (or `vite-plugin-image-optimizer`) for WebP
- `react-helmet-async` — meta tags
- `@tanstack/query-persist-client-core` — TanStack Query persistence
- `react-native-mmkv` — already in stack
- `@react-native-community/netinfo` — connectivity detection
- `@playwright/test` — web E2E
- Maestro or Detox — mobile E2E

## Success Criteria

- [ ] Build outputs valid WebP images under 200KB each
- [ ] Mobile catalog shows cached products without internet + offline badge visible
- [ ] Each web page emits unique `<title>`, `<meta>`, and OG tags
- [ ] `vercel.json` tested with `vite build && npx serve dist` — SPA routing works
- [ ] `eas build -p all --profile production` succeeds without errors
- [ ] E2E tests pass for all 3 critical flows