# @create-node-app/core

## 0.7.0

### Minor Changes

- 3d3bc3f: Cache controls and smart refresh (sub-issue #180 of epic #179)

  **New CLI flags** for the main scaffold command:

  - `--offline` — use the local cache only; do not refresh templates from the network
  - `--no-cache` — disable the on-disk catalog cache and force a refresh on every run
  - `--cache-dir <path>` — override the cache root (defaults to `~/.cache/cna`; also honors `CNA_CACHE_DIR`)
  - `--refresh <mode>` — when to refresh the cached template: `always` | `stale` | `manual` (default: `stale`, controlled by `CNA_REFRESH` and `CNA_REFRESH_AFTER_HOURS`)

  **New `cna cache` subcommand**:

  - `cna cache dir` — print the cache root directory
  - `cna cache list` — list cached templates/extensions (id, url, branch, last fetched, last commit SHA, size)
  - `cna cache clean [id]` — remove one or all entries; pass `--catalog` to also clear the on-disk template catalog cache
  - `cna cache verify [id]` — run `git fsck` on one or all entries, exit non-zero if any entry is corrupt

  **Cache layout improvements**:

  - Per-entry `.cna-meta.json` sidecar with `lastFetchedAt`, `lastCommitSha`, `lastRefreshReason`, `branch`, and `url`
  - Default refresh mode changed from `always` (unconditional `git pull`) to `stale` (pull only if cache is older than `CNA_REFRESH_AFTER_HOURS`, default 24)
  - Working-copy prep now uses `cp -c` (reflink) / `cp -l` (hardlink) with a recursive copy fallback, so warm scaffolds are O(1) on the working dir
  - The template catalog is now persisted to disk and used as a fallback when the network is unavailable

  **Network and dependency hygiene**:

  - Dropped the `axios` dependency; the template catalog now uses the global `fetch` with a 10 s timeout and a `User-Agent: create-awesome-node-app/<version>` header

  See #179 for the parent epic.

### Patch Changes

- 52d31f6: Cleanup (closes #189)

  - **Dead code removed**: `installer.ts` no longer carries the
    `if (false && yarnUsesDefaultRegistry) { ... require.resolve("./yarn.lock.cached") ... }`
    block that referenced a file that was never shipped.
  - **Unused dep removed**: dropped `propagate` from
    `create-awesome-node-app/package.json`. It was declared in
    `dependencies` but never imported.
  - **Stale placeholder removed**: the `{ type: null, name: "__removed_aiTool" }`
    entry in the interactive prompts has been deleted. The
    `aiTool`-stripping branch in the non-interactive path is kept for
    backward compatibility.
  - **ESM-native loading in core**: `package.ts` now uses
    `createRequire` (from `node:module`) and dynamic `import(url, { with: { type: "json" } })`
    for JSON, replacing the `require()` shim that only worked because
    of `tsup --shims`. No behavior change.
  - **Testable error handler**: extracted the main `catch` block from
    `index.ts` into a named export `handleMainError(err, verbose)` so
    the dispatcher can be unit-tested in isolation.
  - **Pre-commit hook widened**: root `.lintstagedrc.json` now runs
    `eslint --fix` on `*.{js,ts,jsx,tsx}` (the per-package configs
    already did).
  - **Docs**: the root `README.md` "Local Development" section now
    documents the Node 22 requirement pinned in `.node-version`.

- e068db9: Concurrency safety improvements (closes #185)

  - **C4 — `try/finally` around cwd change**: `createApp` in
    `installer.ts` now restores the original working directory after `run()`
    completes or throws. Added `return await` to ensure the `finally` block
    fires after the async pipeline settles.
  - **C3 — `Promise.all` → `Promise.allSettled`**: `loadFiles` in
    `loaders.ts` now collects all copy failures instead of failing fast on
    the first one. If any operation rejects, a single error listing all
    failures is thrown.

- 8ac5338: Config drift alignment (closes #183)

  - **AGENTS.md**: corrected from `pnpm 10+` to `npm 10+` — the repo uses
    `npm` workspaces with `packageManager: "npm@10.9.2"`.
  - **Dev container**: `VARIANT` bumped from `18` to `22` so contributors
    get a Node 22 shell by default.
  - **Engines**: `engines.npm` tightened from `>=7.0.0` (irrelevant — npm 7
    is below the bundled npm 10 in Node 22) to `>=10.9.2`, matching
    `packageManager`.
  - **MegaLinter**: re-enabled `REPOSITORY_GITLEAKS` (disabled without
    explanation alongside `CHECKOV`, `GRYPE`, `TRIVY` which are heavy
    scanners; Gitleaks is lightweight secret detection).
  - **README**: added Node 22 LTS and npm 10 badges in the badge row.

- bab045f: Observability, signal handling, and silent-failure exit codes (closes #181)

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

- a62cda6: Reproducibility improvements (closes #186)

  - **V2 — `--strict-version` flag**: new CLI flag (also `CNA_STRICT_VERSION=1`)
    that causes the version-outdated warning to exit with code 1 instead of
    just printing a warning.
  - **V4 — Roadmap link**: the "template version pinning" roadmap item in
    `create-awesome-node-app/README.md` now links to this issue.
  - **V1 — `?ref=<sha>` URL param**: templates/extensions can now be pinned
    to a specific commit by appending `?ref=<full-sha>` to the URL. The
    SHA overrides the branch from the URL path. When `CNA_STRICT_REPRO=1`
    is set, the ref must be a full 40-character hex SHA or the CLI exits
    with an error.

- f012ccd: Security hardening (closes #182)

  - **F5 — Fetch timeout and user-agent**: dist-tags fetch in `core/index.ts` now uses `AbortSignal.timeout(10_000)` and a descriptive `User-Agent` header. `CNA_USER_AGENT` and `CNA_CORE_VERSION` are exported from `@create-node-app/core`.
  - **F2 — Prompt type restriction**: custom options in `cna.config.json` with `type: "invisible"` or `type: "password"` are skipped with a console warning, preventing config-file-driven prompt harvesting.
  - **F1 — Security policy**: new `SECURITY.md` covering the template RCE threat model, hash-pinned URL best practices, network call inventory, and vulnerability reporting.

- bc66d86: Test coverage for core package (closes #187)

  - **T5**: new `config.test.mts` — `loadTemplateCnaConfig` tests for valid
    config, missing config (returns `null`), and non-existent template URL.
  - **T8**: new `installer.test.mts` — `extractNameAndVersion` tests covering
    simple packages, scoped packages, packages without versions, and the
    known edge case where `@scope/package` is parsed incorrectly (scope `@` is taken
    as the version separator).
  - Exported `extractNameAndVersion` from `installer.ts` for testability.

## 0.6.10

### Patch Changes

- 8264781: fix(packages): add repository.url to all publishable package.json files

  The npm Trusted Publishing provenance check requires package.json repository.url to match the GitHub repository exactly. Adds the missing repository field to all scoped packages and normalizes create-awesome-node-app's URL to the bare HTTPS form.

## 0.6.9

### Patch Changes

- 226af9c: fix(ci): rely on npm CLI OIDC auto-detection for trusted publishing

  Removes the manual OIDC token exchange because npm CLI >= 11.5.1 automatically detects GitHub Actions OIDC and authenticates during `npm publish`. Drops `NODE_AUTH_TOKEN` and `NPM_CONFIG_PROVENANCE` overrides so the CLI can manage both auth and provenance by itself.

## 0.6.8

### Patch Changes

- f03b4c5: fix(ci): use correct OIDC audience and add exchange diagnostics

  Adds `audience=registry.npmjs.org` to the GitHub id-token request, validates the npm access token is non-empty, and prints the npm error response on failure instead of silently falling through with an empty token.

## 0.6.7

### Patch Changes

- 8f5de37: fix(ci): exchange GitHub OIDC token for npm access token

  Adds the explicit OIDC-to-npm token exchange required by npm Trusted Publishing. npm does not perform this exchange automatically from `NPM_CONFIG_PROVENANCE` alone; we call the npm `/security/oidc-token` endpoint with the GitHub id-token and use the returned short-lived access token for publish.

## 0.6.6

### Patch Changes

- d00fa9f: fix(ci): enable npm Trusted Publishing with provenance

  Configures the publish workflow to use npm Trusted Publishing (OIDC) by removing the legacy registry-url setup and enabling `--provenance` on `changeset publish`. Also switches `.changeset/config.json` access from `restricted` to `public` so scoped packages can be published via OIDC.

## 0.6.5

### Patch Changes

- 7783da4: fix(ci): switch to npm trusted publishing via OIDC with protected npm-publish environment

## 0.6.4

### Patch Changes

- Updated docs

## 0.6.3

### Patch Changes

- Updated docs

## 0.6.2

### Patch Changes

- Fixed warnings in create-node-app core

## 0.6.1

### Patch Changes

- docs: add comprehensive READMEs for all workspace packages

## 0.6.0

### Minor Changes

- Local first flags for testing

## 0.5.7

### Patch Changes

- Some improvements and fixes

## 0.5.6

### Patch Changes

- Updated docs

## 0.5.5

### Patch Changes

- Fix scaffolding so full template file tree is copied instead of producing an almost empty project.

  Highlights:
  - Repair file discovery: removed broken readdirp negative-only filter that yielded 0 matches; now enumerate all files then apply internal skip rules.
  - Correct handling of special `[src]/` token directories so template source files land in the configured `srcDir`.
  - Add missing runtime dependency `fs-extra` (previously only implicitly relied upon) to prevent potential runtime module resolution errors.
  - Fix `appendTemplate` mapping so templated append operations render correctly (was incorrectly using plain append loader).
  - Add verbose debug logs (behind `--verbose`) for template directory resolution, first discovered file, and total operations count to ease future diagnostics.
  - Strengthen smoke test to assert presence of critical scaffold artifacts (e.g. `README.md`, `tsconfig.json`, `index.html`, `eslint.config.mjs`, `src/App.tsx`, `src/main.tsx`).

  Result: Running the CLI now prepares and copies ~50 operations for the React Vite starter template (previously 0), restoring expected developer experience.

## 0.5.4

### Patch Changes

- Fix

## 0.5.2

### Patch Changes

- Fix deps

## 0.5.0

### Minor Changes

- Great refactor

## 0.4.0

### Minor Changes

- Added AI support

## 0.3.18

### Patch Changes

- Added new flags

## 0.3.17

### Patch Changes

- Updated version

## 0.3.16

### Patch Changes

- 0515e1d: Updated CLI options

## 0.3.15

### Patch Changes

- Updated run fallbacks

## 0.3.14

### Patch Changes

- Updated deps

## 0.3.13

### Patch Changes

- Keep permissions from original files when doing the scaffolding

## 0.3.12

### Patch Changes

- Updated pnpm flags

## 0.3.11

### Patch Changes

- Added CI mode

## 0.3.10

### Patch Changes

- Updated source code to be more performant

## 0.3.9

### Patch Changes

- Small fix

## 0.3.8

### Patch Changes

- Simple fix

## 0.3.7

### Patch Changes

- Updated package loader

## 0.3.6

### Patch Changes

- Added conditional installation for npm, yarn and pnpm

## 0.3.5

### Patch Changes

- Updated instructions

## 0.3.4

### Patch Changes

- Updated instructions

## 0.3.3

### Patch Changes

- Don't show content in stdout on some cases

## 0.3.2

### Patch Changes

- Updated fomatting to pass

## 0.3.1

### Patch Changes

- Little fix to handle new format

## 0.3.0

### Minor Changes

- Check for correct node version on runtime

## 0.2.6

### Patch Changes

- Updated package generation

## 0.2.5

### Patch Changes

- Added package managers and custom options

## 0.2.4

### Patch Changes

- Added flags for yarnpkg

## 0.2.3

### Patch Changes

- 25714c8: Updated extensions schema type
