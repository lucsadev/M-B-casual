# Deployment Vercel Specification

## Purpose

Production-ready Vercel deployment with SPA fallback, verified build, and deploy script.

## Requirements

### Requirement: SPA fallback routing

The `vercel.json` MUST define a rewrite rule that maps all non-file routes to `/index.html` for client-side routing. Static assets (images, JS, CSS) SHALL NOT be rewritten.

#### Scenario: Direct URL access to product page

- GIVEN a user entering `/producto/remera-negra` in the browser
- WHEN Vercel receives the request
- THEN it serves `/index.html` AND the React router handles the route

#### Scenario: Static asset not rewritten

- GIVEN a request to `/assets/main-abc123.js`
- WHEN Vercel receives the request
- THEN the file is served directly (not rewritten to index.html)

### Requirement: Production build verification

`vite build` MUST exit with code 0 and produce output in the configured `dist` directory. The build SHALL complete within 60 seconds for cold builds.

#### Scenario: Successful build

- GIVEN a clean checkout of the web package
- WHEN running `pnpm --filter @mbt/shared build && tsc --noEmit && vite build`
- THEN all files output to `dist/` AND exit code is 0 AND no TypeScript errors block the build

#### Scenario: Shared package built before web type-check

- GIVEN the `@mbt/shared` package extends `tsconfig.base.json` with `composite: true`
- WHEN the web package runs `tsc --noEmit` with `references: [{ "path": "../shared" }]`
- THEN the shared package MUST be compiled first (`dist/`) so TypeScript can resolve its declaration files

### Requirement: PWA support

The production build SHALL include a service worker (`sw.js`) with network-first navigation strategy and cache-first asset strategy. A Web App Manifest (`manifest.webmanifest`) SHALL be served at the root for installable PWA support.

### Requirement: Deploy script

The root `package.json` SHOULD include a `deploy:vercel` script that runs the build and deploys via Vercel CLI or git integration. The script SHALL fail if the build fails.

#### Scenario: Deploy script runs

- GIVEN the repository is connected to Vercel
- WHEN running `pnpm deploy:vercel`
- THEN `vite build` runs first AND if successful, Vercel CLI deploys the `dist/` folder
