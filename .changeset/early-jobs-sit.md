---
"@create-node-app/core": minor
"create-awesome-node-app": minor
---

feat: extension incompatibility validation (#255)

Adds the ability for extensions to declare themselves incompatible with
other extensions, preventing users from selecting conflicting combos.

- New `incompatibleWith?: string[]` field on `TemplateOrExtensionData`
- New `findIncompatiblePairs()` / `validateIncompatibleExtensions()`
  functions in `templates.ts`
- New `IncompatibleExtensionsError` with `CNA_INCOMPATIBLE_EXTENSIONS`
  error code in `@create-node-app/core`
- **Interactive mode**: warns with styled output when incompatible
  extensions are selected together
- **Non-interactive mode**: fails fast with a clear error listing
  conflicting pairs
- Fixture catalog updated with an incompatible extension pair for
  testing (`incompatible-addon` ↔ `example-addon`)
- Tests added for `findIncompatiblePairs()`
