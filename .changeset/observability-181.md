---
"create-awesome-node-app": patch
"@create-node-app/core": patch
---

Observability, signal handling, and silent-failure exit codes (closes #181)

- **`CnaError` class hierarchy**: new `errors.ts` with `CnaError` (base),
  `ConfigParseError`, `ManifestLoadError`, `PackageManagerFallback`, and
  `ScaffoldAbortedError`. Each carries a machine-readable `code` and
  human-readable `suggestions[]`. Exported from `@create-node-app/core`.
- **`SIGINT`/`SIGTERM` handler**: `createApp` in `installer.ts` now
  registers a one-shot signal handler that cleans up the partial scaffold
  directory and exits `128+signal_code` before any scaffolding work begins.
- **`git init` failure**: sets `process.exitCode = 1` instead of
  continuing silently.
- **`format`/`lint:fix` failure**: `runCommandInProjectDir` sets
  `process.exitCode = 1` on failure instead of silently swallowing.
- **Malformed `cna.config.json`**: `loadTemplateCnaConfig` now throws
  `ConfigParseError` instead of returning `null`. Callers in `options.ts`
  catch it and print a yellow warning so the user sees the parse error
  without the CLI crashing.
