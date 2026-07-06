---
"@create-node-app/core": patch
"create-awesome-node-app": patch
---

Fix `--cache-dir` / `CNA_CACHE_DIR` not scoping the working dir at all — the working copy was always written to `~/.cna/`. The CLI only sets the env var, not the opt, so `paths.ts` now also reads `CNA_CACHE_DIR` as a fallback when computing the working dir.
