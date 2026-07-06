---
"@create-node-app/core": patch
---

Test coverage for core package (closes #187)

- **T5**: new `config.test.mts` — `loadTemplateCnaConfig` tests for valid
  config, missing config (returns `null`), and non-existent template URL.
- **T8**: new `installer.test.mts` — `extractNameAndVersion` tests covering
  simple packages, scoped packages, packages without versions, and the
  known edge case where `@scope/package` is parsed incorrectly (scope `@` is taken
  as the version separator).
- Exported `extractNameAndVersion` from `installer.ts` for testability.
