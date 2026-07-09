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
- WHEN running `vite build`
- THEN all files output to `dist/` AND exit code is 0 AND no TypeScript errors block the build

### Requirement: Deploy script

The root `package.json` SHOULD include a `deploy:vercel` script that runs the build and deploys via Vercel CLI or git integration. The script SHALL fail if the build fails.

#### Scenario: Deploy script runs

- GIVEN the repository is connected to Vercel
- WHEN running `pnpm deploy:vercel`
- THEN `vite build` runs first AND if successful, Vercel CLI deploys the `dist/` folder
