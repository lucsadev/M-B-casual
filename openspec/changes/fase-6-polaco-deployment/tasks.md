# Tasks: Fase 6 — Polaco y Deployment

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~880 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (web: images + SEO) → PR 2 (mobile: offline + EAS) → PR 3 (deploy + E2E) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain (PR 1 complete) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain — PR 1 complete, PR 2 next
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | WS1+WS3: Image optimization + SEO (web) | PR 1 | ~300 lines, base=main |
| 2 | WS2+WS5: Offline mode + EAS Build (mobile) | PR 2 | ~230 lines, base=main |
| 3 | WS4+WS6: Vercel deploy + E2E tests | PR 3 | ~350 lines, base=main |

## Phase 1: Dependencies

- [x] 1.1 `packages/web/` — install `vite-plugin-imagemin`, `react-helmet-async`
- [x] 1.2 `packages/mobile/` — install `@tanstack/react-query-persist-client`, `@react-native-community/netinfo`
- [x] 1.3 `packages/web/` — install `@playwright/test` as devDep

## Phase 2: Image Optimization (WS1 — Web)

- [x] 2.1 `packages/web/vite.config.ts` — add `vite-plugin-imagemin` with WebP config
- [x] 2.2 `packages/web/src/components/ui/optimized-image.tsx` — create `<OptimizedImage>` with `<picture>` webp + img fallback + skeleton
- [x] 2.3 Replace `<img>` with `<OptimizedImage>` in ProductCard, ProductDetail, admin product pages
- [ ] 2.4 Test: unit test for OptimizedImage render states (loading → image → error) [no test runner configured]

## Phase 3: SEO (WS3 — Web)

- [x] 3.1 `packages/web/src/main.tsx` — wrap RouterProvider with `<HelmetProvider>`
- [x] 3.2 Add dynamic meta + OG tags to: MainLayout (defaults), HomePage, CatalogPage, ProductDetailPage
- [x] 3.3 `packages/web/src/app/router.tsx` — remove static `<title>` refs (no static `<title>` refs existed — removed from pages' useEffects)
- [x] 3.4 `packages/web/index.html` — keep only global base meta, remove per-page titles
- [x] 3.5 `packages/web/public/sitemap.xml` — create with product + catalog URLs
- [x] 3.6 `packages/web/public/robots.txt` — create allowing all, sitemap link
- [x] 3.7 ProductDetailPage — add JSON-LD (Organization + Product schema)

## Phase 4: Offline Mode (WS2 — Mobile)

- [ ] 4.1 `packages/mobile/src/lib/storage.ts` — replace AsyncStorage with MMKV persister
- [x] 4.2 `packages/mobile/src/lib/query-client.ts` — add `persistQueryClient` + cache version key
- [x] 4.3 `packages/mobile/src/components/connectivity-banner.tsx` — create "Sin conexión" banner with NetInfo
- [ ] 4.4 `packages/mobile/src/hooks/use-online-manager.ts` — create mutation queue + replay on reconnect
- [ ] 4.5 Test: unit test for ConnectivityBanner visibility (NetInfo mock)

## Phase 5: Deploy Configs (WS4 + WS5)

- [x] 5.1 `packages/web/vercel.json` — create with SPA rewrites + cache headers
- [x] 5.2 `package.json` — add `deploy:vercel` script
- [x] 5.3 `packages/mobile/eas.json` — create dev/preview/production profiles
- [x] 5.4 `packages/mobile/app.json` — add deep link scheme (`mbtrend://`), expo-linking plugin
- [ ] 5.5 README.md — add deploy section for Vercel + EAS

## Phase 6: E2E Testing (WS6)

- [x] 6.1 `packages/web/playwright.config.ts` — create config with webServer
- [x] 6.2 `packages/web/e2e/catalog-flow.spec.ts` — browse → add to cart → checkout
- [x] 6.3 `packages/web/e2e/auth-flow.spec.ts` — login → profile → order history
- [x] 6.4 `packages/web/e2e/admin-flow.spec.ts` — admin dashboard → clients → non-admin blocked
