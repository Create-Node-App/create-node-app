# ADR 0003: Git-based template checkout vs npm-published templates

## Decision

Resolve templates and extensions from **Git repositories** (GitHub HTTPS or local `file://` paths), not from npm packages published as scaffolds.

## Rationale

- Templates in `Create-Node-App/cna-templates` evolve frequently; git checkout gives exact commit/branch/ref control (`?ref=`, `--pin`).
- `file://` URLs support local development and CI fixture mode without network access.
- npm-published template tarballs would lag behind catalog updates and complicate private/enterprise starters.

## Consequences

- The CLI clones or copies from git (or file) into a working directory before scaffolding.
- The catalog (`templates.json`) is fetched over HTTPS and cached separately from per-template git clones.
- Users can point `--template` and `--addons` at any compatible GitHub repo or local path, not only the official catalog.
