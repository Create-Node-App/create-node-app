# ADR 0004: Cache design (freshness, staleness, keys)

## Context

Scaffolding repeatedly clones the same template repos. Without a cache, every run is slow and network-heavy; with a naive always-pull cache, behavior is surprising.

## Decision

Cache cloned template/extension repos on disk under a configurable root (`~/.cache/cna` by default, overridable via `--cache-dir` / `CNA_CACHE_DIR`), with **stale-by-default** refresh semantics.

## Alternatives considered

- **No cache (always clone)**: simplest correctness, unacceptable UX for iterative scaffolds.
- **Always refresh**: keeps content fresh but defeats most of the performance benefit.
- **Content-addressed npm-style store**: more complex than needed for git checkouts keyed by URL+ref.

## Rationale

- Repeated scaffolds should not re-clone on every run.
- Unconditional `git pull` on every invocation is slow and surprising; most users want cached content until it is old enough to refresh.
- Explicit cache management (`cna cache list`, `clean`, `verify`, `outdated`, `update`, `doctor`) aids debugging and offline use.

## Key behaviors

| Concern | Behavior |
| --- | --- |
| Cache root | `CNA_CACHE_DIR` or `--cache-dir`; working copy colocated under the same root |
| Entry identity | Derived from normalized URL + branch/ref (base64-encoded path segment) |
| Refresh mode | `always` \| `stale` (default) \| `manual` via `--refresh` or `CNA_REFRESH` |
| Staleness threshold | `CNA_REFRESH_AFTER_HOURS` (default 24 h); stale entries trigger `git fetch` + merge |
| Catalog cache | Separate TTL for `templates.json` (distinct from git clones) |
| Offline | `--offline` uses cache only; `--no-cache` bypasses on-disk cache entirely |

## Consequences

- Default runs are fast and network-light; users opt into aggressive refresh with `--refresh always`.
- Cache corruption is detectable via `cna cache verify` (`git fsck`).
- CI and tests can isolate cache behavior with env vars and fixture directories.
