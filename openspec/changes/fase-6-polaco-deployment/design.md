# Design: Fase 6 — Polaco y Deployment

## Technical Approach

Seis workstreams paralelos que tocan web (imágenes, SEO, Vercel), mobile (offline, EAS Build), y cross-cutting (E2E). Cada workstream es independiente en implementación pero convergen en el mismo release. La estrategia es extender componentes existentes (no reescribir): `<OptimizedImage>` envuelve `<img>` actuales, `react-helmet-async` envuelve el RouterProvider, MMKV reemplaza AsyncStorage en el persist adapter.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| **vite-plugin-imagemin** vs @unlazy | Imagemin: más maduro, comunidad grande, WebP nativo. @unlazy: más moderno pero menos probado | `vite-plugin-imagemin` — estabilidad > novedad |
| **MMKV** vs AsyncStorage para persist | MMKV: 30x más rápido, síncrono, menor footprint. AsyncStorage: ya implementado pero lento | Migrar a MMKV. Ya está en el stack (PLAN_ARQUITECTURA sección 8) |
| **Playwright** vs Cypress | Playwright: mejor DX, auto-wait, parallel execution, más moderno. Cypress: más maduro pero más lento | Playwright — mejor para flujos multi-página |
| **`<picture>` + WebP** vs imagenes nativas | `<picture>`: fallback nativo para browsers viejos. Source set: permite formatos múltiples | `<picture>` source webp + img fallback — cobertura total |
| **react-helmet-async** vs react-helmet | Helmet: warnings de render en React 18. Helmet-async: soporte SSG/SPA | `react-helmet-async` — compatible con React 18 StrictMode |

## Data Flows

### OptimizedImage
```
[Vite build] ─→ imagemin ─→ .jpg/.png → .webp (junto al original)
                                        
[Browser render]
<picture>
  <source srcset="img.webp" type="image/webp" />
  <img src="img.jpg" loading="lazy" />
</picture>
  │
  └── skeleton (CSS shimmer) mientras carga
  └── fallback icon si error
```

### Offline mobile
```
[App boot] ─→ PersistQueryClientProvider ─→ MMKV
                 │                              │
                 ├── restore cached queries ─────┘
                 │                           
                 ├── NetInfo listener ─→ ConnectivityBanner ("Sin conexión")
                 │                           
                 └── OnlineMutationManager ─→ queue mutations → replay on reconnect
```

### SEO data flow
```
[Page render] ─→ react-helmet-async ─→ <head>
                    │
                    ├── title + meta description (route-specific)
                    ├── og:title, og:description, og:image, og:url
                    ├── JSON-LD (ProductPage: Organization + Product schema)
                    └── canonical URL
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/web/vite.config.ts` | Modify | Add `vite-plugin-imagemin` plugin |
| `packages/web/src/components/ui/optimized-image.tsx` | Create | `<OptimizedImage>` component — picture + lazy + skeleton |
| `packages/web/src/main.tsx` | Modify | Wrap RouterProvider with `<HelmetProvider>` |
| `packages/web/src/app/router.tsx` | Modify | Remove any static `<title>` references |
| `packages/web/index.html` | Modify | Keep only global base meta, remove per-page titles |
| `packages/web/public/robots.txt` | Create | Allow all, point to sitemap |
| `packages/web/public/sitemap.xml` | Create | Product + catalog URLs |
| `packages/web/vercel.json` | Create | SPA rewrite rules + cache headers |
| `packages/mobile/src/lib/query-client.ts` | Modify | Add `persistQueryClient` + MMKV adapter |
| `packages/mobile/src/lib/storage.ts` | Modify | Replace AsyncStorage with MMKV persister |
| `packages/mobile/src/components/connectivity-banner.tsx` | Create | "Sin conexión" banner with NetInfo |
| `packages/mobile/src/hooks/use-online-manager.ts` | Create | Mutation queue + replay on reconnect |
| `packages/mobile/eas.json` | Create | dev/preview/production build profiles |
| `packages/mobile/app.json` | Modify | Add deep link scheme (`mbtrend://`), expo-linking plugin |
| `packages/web/e2e/catalog-flow.spec.ts` | Create | Catalog → checkout E2E |
| `packages/web/e2e/auth-flow.spec.ts` | Create | Login → profile → orders |
| `packages/web/e2e/admin-flow.spec.ts` | Create | Admin → clients → orders |
| `packages/web/playwright.config.ts` | Create | Playwright config with webServer |
| `package.json` | Modify | Add `deploy:vercel` script |

## Interfaces / Contracts

```typescript
// OptimizedImage props
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // skip lazy loading for LCP images
}

// OnlineMutationManager (mobile)
interface QueuedMutation {
  key: string;
  mutationFn: () => Promise<unknown>;
  timestamp: number;
}

// connectify badge state
type ConnectivityState = 'online' | 'offline' | 'reconnecting';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `<OptimizedImage>` render states | Vitest + RTL: loading → image → error fallback |
| Unit | ConnectivityBanner visibility | Vitest: NetInfo mock |
| E2E | Catalog → checkout flow | Playwright: browse, filter, add to cart, checkout |
| E2E | Auth → profile → orders | Playwright: login, navigate, assert order list |
| E2E | Admin → clients → detail | Playwright: admin login, navigate, assert client data |
| E2E | Empty cart redirect | Playwright: direct `/checkout` → redirect to `/carrito` |
| E2E | Invalid login error | Playwright: wrong credentials → error message |
| E2E | Non-admin access denied | Playwright: regular user → `/admin` → blocked |

## Migration / Rollout

- **Mobile persist**: AsyncStorage → MMKV is data format compatible (JSON). Existing cached data will be lost on upgrade — acceptable for this stage.
- **Web images**: Old `<img>` tags remain functional. Migration to `<OptimizedImage>` can be incremental per page.
- **No database migration required.**

## Open Questions

- [ ] What's the concurrency strategy for Vite imagemin — sequential or parallel per image?
- [ ] Should offline mutation queue persist to MMKV or only in-memory?
- [ ] E2E: test user credentials for admin flow — use `.env` or hardcoded test seed?
