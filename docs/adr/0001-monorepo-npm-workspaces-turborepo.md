# ADR 0001: Monorepo with npm workspaces + Turborepo

## Decision

Organize the repository as an npm workspaces monorepo (`packages/*`) orchestrated by Turborepo.

## Rationale

- The CLI (`create-awesome-node-app`), shared core (`create-node-app-core`), and supporting packages ship together but publish independently via Changesets.
- npm workspaces provide a single lockfile and hoisted devDependencies without extra tooling.
- Turborepo caches build/lint/test tasks across packages and keeps CI fast.

## Consequences

- Root `package.json` owns shared dev tooling (ESLint, Prettier, Changesets, Turbo).
- Package scripts are invoked via `turbo run <task>` from the root.
- Version bumps and npm publishes are per-package through Changesets, not a single unified version.
