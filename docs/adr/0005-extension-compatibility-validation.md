# ADR 0005: Extension compatibility validation

## Decision

Extensions declare incompatible peers in catalog metadata (`incompatibleWith: string[]`). The CLI validates selected extensions **before scaffolding** and fails fast with a clear error when a conflict is detected.

## Rationale

- Some extension pairs are mutually exclusive (e.g. competing UI or state-management stacks).
- Late failures during file merge produce partial projects and poor UX.
- Declarative metadata in `templates.json` keeps rules centralized and reviewable in `cna-templates`.

## Implementation

- `findIncompatiblePairs()` scans selected slugs against each extension's `incompatibleWith` list (symmetric).
- `validateIncompatibleExtensions()` throws `IncompatibleExtensionsError` when any pair conflicts.
- Validation runs after extension selection in interactive mode and when `--addons` is supplied non-interactively.

## Consequences

- New extensions must document incompatibilities in catalog metadata, not only in README prose.
- Template filtering (`getCompatibleExtensions`) hides extensions that conflict with the chosen template type.
- Adding a new incompatible pair is a catalog change in `cna-templates`, not a CLI code change.
