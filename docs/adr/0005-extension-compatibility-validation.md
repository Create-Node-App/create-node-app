# ADR 0005: Extension compatibility validation

## Context

Some extensions are mutually exclusive. Users can select addons from the catalog (slugs) or pass arbitrary `--addons` / `--extend` URLs (see ADR 0003). Conflicts should fail before a partial project is written.

## Decision

Extensions declare incompatible peers in **catalog metadata** (`incompatibleWith: string[]`). The CLI validates selected extensions **before scaffolding** and fails fast when a conflict is detected **for catalog-resolved extensions**.

## Scope (catalog vs direct URLs)

- Validation applies when an addon/extend value resolves to a **catalog slug** (or a URL that exactly matches a catalog entry URL), so `incompatibleWith` metadata is available.
- Direct URLs that are **not** in the catalog are layered without catalog-based incompatibility checks. Operators of private/custom extensions own documenting conflicts; the CLI does not invent metadata for unknown URLs.
- Future work may optionally fetch remote `cna.config.json` / catalog sidecars for URL addons; that is intentionally out of scope for this ADR.

## Alternatives considered

- **Validate only after merge**: simpler code, worse UX (partial trees).
- **Hard-code conflicts in the CLI**: drifts from `cna-templates` and forks.
- **Require catalog membership for all addons**: rejects legitimate private URL workflows from ADR 0003.

## Rationale

- Some extension pairs are mutually exclusive (e.g. competing UI or state-management stacks).
- Late failures during file merge produce partial projects and poor UX.
- Declarative metadata in `templates.json` keeps rules centralized and reviewable in `cna-templates`.

## Implementation

- `findIncompatiblePairs()` scans selected slugs against each extension's `incompatibleWith` list (symmetric).
- `validateIncompatibleExtensions()` throws `IncompatibleExtensionsError` when any pair conflicts.
- Validation runs after extension selection in interactive mode and when `--addons` is supplied non-interactively for catalog-resolved entries.

## Consequences

- New extensions must document incompatibilities in catalog metadata, not only in README prose.
- Template filtering (`getCompatibleExtensions`) hides extensions that conflict with the chosen template type.
- Adding a new incompatible pair is a catalog change in `cna-templates`, not a CLI code change.
- Direct non-catalog URLs remain supported; they skip catalog incompatibility validation by design.
