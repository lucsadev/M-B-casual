# Monorepo Setup Specification

## Purpose

Define the monorepo structure using pnpm workspaces with three packages: `@mbt/shared`, `@mbt/web`, `@mbt/mobile`. This is the foundation every other capability builds upon.

## Requirements

### Requirement: Root workspace configuration

The root MUST define a `pnpm-workspace.yaml` with `packages: ['packages/*']`. The root `package.json` MUST specify `"private": true` and define `"scripts"` for workspace-wide lint, format, type-check, and clean.

#### Scenario: Workspace installs all packages

- GIVEN a root `pnpm-workspace.yaml` pointing to `packages/*`
- WHEN `pnpm install` runs
- THEN all three packages (`shared`, `web`, `mobile`) are linked and resolvable via `@mbt/*` aliases

#### Scenario: Missing workspace directory

- GIVEN a workspace entry in `pnpm-workspace.yaml`
- WHEN the directory does not exist
- THEN `pnpm install` MUST fail with a clear error indicating the missing package

### Requirement: TypeScript base config

The root MUST provide a `tsconfig.base.json` with shared compiler options: `target: ES2022`, `module: NodeNext`, `strict: true`, `declaration: true`, and `paths` mapping `@mbt/*` to `packages/*/src`.

#### Scenario: Base config extends correctly

- GIVEN `tsconfig.base.json` with path mappings
- WHEN a package's `tsconfig.json` extends `../tsconfig.base.json`
- THEN `tsc --noEmit` resolves `@mbt/shared` imports without errors

### Requirement: Package-level configuration

Each package (`shared`, `web`, `mobile`) MUST have a `package.json` with `"name": "@mbt/{name}"` and a `tsconfig.json` extending the base config.

#### Scenario: All packages have valid package.json

- GIVEN the monorepo root
- WHEN checking each `packages/*/package.json`
- THEN each MUST have a unique `@mbt/{name}` name and valid `exports` field

## Acceptance Criteria

- [ ] `pnpm install` completes without errors
- [ ] `tsc --noEmit` passes across all packages
- [ ] `@mbt/shared` is importable from `@mbt/web` and `@mbt/mobile`

## Dependencies

None — this is the root capability.
