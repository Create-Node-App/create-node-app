# ADR 0001: Monorepo with npm workspaces + Turborepo

## Context

create-node-app ships a user-facing CLI, a reusable core library, and shared ESLint/TS configs that must stay version-aligned during development while publishing independently.

## Decision

Organize the repository as an npm workspaces monorepo (`packages/*`) orchestrated by Turborepo.

## Alternatives considered

- **Single package repo**: simpler layout, but couples CLI and core release cadence and blocks sharing configs cleanly.
- **pnpm / Yarn workspaces**: viable; npm workspaces were chosen to match the ecosystem default for consumers and CI (`npm ci`).
- **No Turborepo**: plain npm scripts work at small scale; Turborepo was chosen for cached `build` / `lint` / `test` graphs as packages grow.

## Rationale

- The CLI (`create-awesome-node-app`), shared core (`create-node-app-core`), and supporting packages ship together but publish independently via Changesets.
- npm workspaces provide a single lockfile and hoisted devDependencies without extra tooling.
- Turborepo caches build/lint/test tasks across packages and keeps CI fast.

## Consequences

- Root `package.json` owns shared dev tooling (ESLint, Prettier, Changesets, Turbo).
- Package scripts are invoked via `turbo run <task>` from the root.
- Version bumps and npm publishes are per-package through Changesets, not a single unified version.
