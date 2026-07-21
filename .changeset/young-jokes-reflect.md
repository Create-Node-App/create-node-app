---
"create-awesome-node-app": minor
---

feat: branded interactive prompts with styled choices (#256)

Extracts prompt styling into a dedicated `prompt-style.ts` module and
makes category colors deterministic (hash-based) instead of sequential.

- New `prompt-style.ts` module with:
  - `categoryStyle(slug)` — deterministic color via slug hash
  - `makeSearchableChoice()` — styled choice builder with NO_COLOR support
  - `shortCategoryLabel()` — compact category badge
  - `colorsEnabled()` — checks `NO_COLOR` env var
- Category colors are now stable across CLI runs (same slug = same color)
- Respects `NO_COLOR` env var in choice badge rendering
- Removes unused `IncompatibleExtensionsError` import from `options.ts`
