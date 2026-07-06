# create-awesome-node-app

## 0.11.2

### Patch Changes

- 17ec4a7: Fix two bugs found during end-to-end testing:

  - **`--list-addons` returned empty list** — `getExtensionsGroupedByCategory` was filtering by `["all"]`, but the registry catalogs extensions by their actual types (`react`, `nextjs`, etc.), so the filter never matched. Now passing an empty type array means "show all extensions".
  - **`--cache-dir` did not scope the working dir** — the working copy at `~/.cna/<base64>` was hardcoded and ignored the user-provided `cacheDir`. Now the working dir is colocated under the `cacheDir` when one is set, otherwise falls back to `~/.cna/`.

- Updated dependencies [17ec4a7]
  - @create-node-app/core@0.7.3

## 0.11.1

### Patch Changes

- 700494a: Fix broken CJS bundle — `commander@15` and `readdirp@5` are ESM-only and broke `require()` in the bundled `dist/index.cjs` shipped to npm. Downgraded to `commander@14.0.2` and `readdirp@4.1.2`, both of which support CJS. The CLI was unusable when installed via `npm i -g create-awesome-node-app` (only worked via `npx`, which uses the ESM entry).
- Updated dependencies [700494a]
  - @create-node-app/core@0.7.2

## 0.11.0

### Minor Changes

- 79c992c: Remaining features from epic #179: `--pin`, `cache outdated`, `cache update`, `cache doctor`, docs update (closes #188)

  - **`--pin <ref>`**: new CLI flag to pin templates to a specific commit SHA, tag, or branch. Equivalent to `?ref=<ref>` on the template URL.
  - **`cna cache outdated`**: new subcommand that compares local commit SHAs against remote tips via `git ls-remote`. Shows which cached entries are behind.
  - **`cna cache update [id]`**: new subcommand that force-refreshes one or all cached entries via `git fetch && git merge`.
  - **`cna cache doctor`**: new subcommand that diagnoses cache health — checks git availability, network reachability, cache directory permissions, and entry integrity.
  - **Docs**: added Security section linking to `SECURITY.md`, `--pin` flag reference, cache subcommand docs for outdated/update/doctor, pinning examples, and cache diagnostics examples.
  - **Root AGENTS.md**: added `type-check` to key commands.

### Patch Changes

- b9e0e77: Windows compatibility fixes (closes #184)

  - **executable.ts**: Pass bare command name without `.cmd` suffix — lets Node.js resolve via PATH + PATHEXT, fixing `bun` and `node` on Windows.
  - **paths.ts**: Broaden file URL normalization to handle UNC paths (`file:////server/share`), drive-relative paths (`file:///C:path`), plus existing `file:///C:/path`.
  - **paths.ts**: Export `solveValuesFromTemplateOrExtensionUrl` for testing.
  - **installer.ts**: Prepend `\\?\` prefix when project path exceeds 200 chars to bypass MAX_PATH on Windows.
  - **loaders.ts**: Case-insensitive file skip matching (`toLowerCase()`) to handle Windows case-insensitive filesystem.
  - **README.md**: Add "Platform Notes" section documenting Windows behaviors.
  - **CI**: Add `unit-tests-windows` job; add `windows-latest` + `bun` to cross-platform scaffold matrix.

- Updated dependencies [b9e0e77]
  - @create-node-app/core@0.7.1

## 0.10.0

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

- Updated dependencies [3d3bc3f]
- Updated dependencies [52d31f6]
- Updated dependencies [e068db9]
- Updated dependencies [8ac5338]
- Updated dependencies [bab045f]
- Updated dependencies [a62cda6]
- Updated dependencies [f012ccd]
- Updated dependencies [bc66d86]
  - @create-node-app/core@0.7.0

## 0.9.9

### Patch Changes

- 8264781: fix(packages): add repository.url to all publishable package.json files

  The npm Trusted Publishing provenance check requires package.json repository.url to match the GitHub repository exactly. Adds the missing repository field to all scoped packages and normalizes create-awesome-node-app's URL to the bare HTTPS form.

- Updated dependencies [8264781]
  - @create-node-app/core@0.6.10

## 0.9.8

### Patch Changes

- 226af9c: fix(ci): rely on npm CLI OIDC auto-detection for trusted publishing

  Removes the manual OIDC token exchange because npm CLI >= 11.5.1 automatically detects GitHub Actions OIDC and authenticates during `npm publish`. Drops `NODE_AUTH_TOKEN` and `NPM_CONFIG_PROVENANCE` overrides so the CLI can manage both auth and provenance by itself.

- Updated dependencies [226af9c]
  - @create-node-app/core@0.6.9

## 0.9.7

### Patch Changes

- f03b4c5: fix(ci): use correct OIDC audience and add exchange diagnostics

  Adds `audience=registry.npmjs.org` to the GitHub id-token request, validates the npm access token is non-empty, and prints the npm error response on failure instead of silently falling through with an empty token.

- Updated dependencies [f03b4c5]
  - @create-node-app/core@0.6.8

## 0.9.6

### Patch Changes

- 8f5de37: fix(ci): exchange GitHub OIDC token for npm access token

  Adds the explicit OIDC-to-npm token exchange required by npm Trusted Publishing. npm does not perform this exchange automatically from `NPM_CONFIG_PROVENANCE` alone; we call the npm `/security/oidc-token` endpoint with the GitHub id-token and use the returned short-lived access token for publish.

- Updated dependencies [8f5de37]
  - @create-node-app/core@0.6.7

## 0.9.5

### Patch Changes

- d00fa9f: fix(ci): enable npm Trusted Publishing with provenance

  Configures the publish workflow to use npm Trusted Publishing (OIDC) by removing the legacy registry-url setup and enabling `--provenance` on `changeset publish`. Also switches `.changeset/config.json` access from `restricted` to `public` so scoped packages can be published via OIDC.

- Updated dependencies [d00fa9f]
  - @create-node-app/core@0.6.6

## 0.9.4

### Patch Changes

- 7783da4: fix(ci): switch to npm trusted publishing via OIDC with protected npm-publish environment
- Updated dependencies [7783da4]
  - @create-node-app/core@0.6.5

## 0.9.3

### Patch Changes

- Updated docs
- Updated dependencies
  - @create-node-app/core@0.6.4

## 0.9.2

### Patch Changes

- Updated docs
- Updated dependencies
  - @create-node-app/core@0.6.3

## 0.9.1

### Patch Changes

- Fixed warnings in create-node-app core
- Updated dependencies
  - @create-node-app/core@0.6.2

## 0.9.0

### Minor Changes

- docs: add comprehensive READMEs for all workspace packages

## 0.8.0

### Minor Changes

- Local first flags for testing

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.6.0

## 0.7.1

### Patch Changes

- Some improvements and fixes
- Updated dependencies
  - @create-node-app/core@0.5.7

## 0.7.0

### Minor Changes

- Interactive mode by default

## 0.6.7

### Patch Changes

- Updated docs
- Updated dependencies
  - @create-node-app/core@0.5.6

## 0.6.6

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

- Updated dependencies
  - @create-node-app/core@0.5.5

## 0.6.5

### Patch Changes

- Fix
- Updated dependencies
  - @create-node-app/core@0.5.4

## 0.6.2

### Patch Changes

- Fix deps
- Updated dependencies
  - @create-node-app/core@0.5.2

## 0.6.0

### Minor Changes

- Great refactor

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.5.0

## 0.5.0

### Minor Changes

- Added AI support

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.4.0

## 0.4.27

### Patch Changes

- Added new flags
- Updated dependencies
  - @create-node-app/core@0.3.18

## 0.4.26

### Patch Changes

- Updated version
- Updated dependencies
  - @create-node-app/core@0.3.17

## 0.4.25

### Patch Changes

- 0515e1d: Updated CLI options
- Updated dependencies [0515e1d]
  - @create-node-app/core@0.3.16

## 0.4.24

### Patch Changes

- Updated run fallbacks
- Updated dependencies
  - @create-node-app/core@0.3.15

## 0.4.23

### Patch Changes

- Updated deps
- Updated dependencies
  - @create-node-app/core@0.3.14

## 0.4.22

### Patch Changes

- Keep permissions from original files when doing the scaffolding
- Updated dependencies
  - @create-node-app/core@0.3.13

## 0.4.21

### Patch Changes

- Updated pnpm flags
- Updated dependencies
  - @create-node-app/core@0.3.12

## 0.4.20

### Patch Changes

- Mentioned in awesome

## 0.4.19

### Patch Changes

- Added CI mode
- Updated dependencies
  - @create-node-app/core@0.3.11

## 0.4.18

### Patch Changes

- Updated source code to be more performant
- Updated dependencies
  - @create-node-app/core@0.3.10

## 0.4.17

### Patch Changes

- Updated changelog

## 0.4.16

### Patch Changes

- Updated docs

## 0.4.15

### Patch Changes

- Small fix
- Updated dependencies
  - @create-node-app/core@0.3.9

## 0.4.14

### Patch Changes

- Simple fix
- Updated dependencies
  - @create-node-app/core@0.3.8

## 0.4.13

### Patch Changes

- Updated package loader
- Updated dependencies
  - @create-node-app/core@0.3.7

## 0.4.12

### Patch Changes

- Added conditional installation for npm, yarn and pnpm
- Updated dependencies
  - @create-node-app/core@0.3.6

## 0.4.11

### Patch Changes

- Rollback

## 0.4.10

### Patch Changes

- Updated type match

## 0.4.9

### Patch Changes

- Removed language option

## 0.4.8

### Patch Changes

- Updated usage instructions

## 0.4.7

### Patch Changes

- Updated docs with small demo

## 0.4.6

### Patch Changes

- Updated instructions
- Updated dependencies
  - @create-node-app/core@0.3.5

## 0.4.5

### Patch Changes

- Updated instructions
- Updated dependencies
  - @create-node-app/core@0.3.4

## 0.4.4

### Patch Changes

- Don't show content in stdout on some cases
- Updated dependencies
  - @create-node-app/core@0.3.3

## 0.4.3

### Patch Changes

- Updated fomatting to pass
- Updated dependencies
  - @create-node-app/core@0.3.2

## 0.4.2

### Patch Changes

- Little fix to handle new format
- Updated dependencies
  - @create-node-app/core@0.3.1

## 0.4.1

### Patch Changes

- Updated documentation

## 0.4.0

### Minor Changes

- Check for correct node version on runtime

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.3.0

## 0.3.8

### Patch Changes

- Updated package generation
- Updated dependencies
  - @create-node-app/core@0.2.6

## 0.3.7

### Patch Changes

- Simple fix to check for latest version

## 0.3.6

### Patch Changes

- Added package managers and custom options
- Updated dependencies
  - @create-node-app/core@0.2.5

## 0.3.5

### Patch Changes

- Added flags for yarnpkg
- Updated dependencies
  - @create-node-app/core@0.2.4

## 0.3.4

### Patch Changes

- Stop execution if the version is not latest

## 0.3.3

### Patch Changes

- Added language as an option
- 25714c8: Updated extensions schema type
- Updated dependencies [25714c8]
  - @create-node-app/core@0.2.3
