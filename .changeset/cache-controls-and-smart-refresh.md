---
"create-awesome-node-app": minor
"@create-node-app/core": minor
---

Cache controls and smart refresh (sub-issue #180 of epic #179)

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
