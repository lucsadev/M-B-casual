# Tooling Base Specification

## Purpose

Configure shared developer tooling across the monorepo: ESLint, Prettier, TypeScript per-package config, Git setup, and a root README.

## Requirements

### Requirement: ESLint flat config

The root MUST provide an `eslint.config.js` (flat config) with TypeScript rules enabled. Each package MAY override rules via a local `eslint.config.js` that merges with the root.

#### Scenario: Lint catches type error

- GIVEN code with an unused variable
- WHEN `pnpm lint` runs
- THEN ESLint reports the unused variable error

#### Scenario: Package override works

- GIVEN a `packages/mobile/eslint.config.js` that adds React Native rules
- WHEN linting a mobile file
- THEN both root rules and RN-specific rules apply

### Requirement: Prettier shared config

The root MUST define a `.prettierrc` with consistent formatting: `semi: true`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`. All packages MUST use this config.

#### Scenario: Format produces consistent output

- GIVEN a valid `.ts` file with inconsistent quoting
- WHEN `pnpm format` runs
- THEN all quotes are converted to single quotes and trailing commas are added

### Requirement: Per-package TypeScript configs

Each package MUST have its own `tsconfig.json` extending `../tsconfig.base.json` with package-specific settings: `outDir: ./dist`, `rootDir: ./src`, and `composite: true`.

#### Scenario: Compilation outputs to dist

- GIVEN any package with `tsconfig.json` extending base
- WHEN `tsc` runs in that package
- THEN compiled JS output lands in `packages/{name}/dist/`

### Requirement: npm scripts

The root `package.json` MUST define workspace scripts: `lint`, `format`, `type-check`, `clean`. Each MUST run the corresponding tool across all packages.

#### Scenario: Clean removes all dist directories

- GIVEN existing `dist/` folders in packages
- WHEN `pnpm clean` runs
- THEN all `dist/` directories are removed

### Requirement: Git initialization

The repository MUST have a `.gitignore` covering `node_modules/`, `dist/`, `.env`, `.expo/`, `supabase/.temp`, and OS files. The root MUST include a `README.md` with project name, stack, and setup instructions.

#### Scenario: .gitignore prevents accidental commits

- GIVEN a `node_modules/` directory
- WHEN `git status` is run
- THEN `node_modules/` does NOT appear in tracked files

## Acceptance Criteria

- [ ] `pnpm lint` passes on all packages with zero errors
- [ ] `pnpm format` produces consistent code style
- [ ] `pnpm type-check` passes with `tsc --noEmit`
- [ ] `pnpm clean` removes all build artifacts
- [ ] `.gitignore` excludes all generated/dependency directories

## Dependencies

- `monorepo-setup` — requires workspace structure to exist
