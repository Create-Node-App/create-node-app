---
"@create-node-app/core": patch
"create-awesome-node-app": patch
---

Fix two bugs found during end-to-end testing:

- **`--list-addons` returned empty list** — `getExtensionsGroupedByCategory` was filtering by `["all"]`, but the registry catalogs extensions by their actual types (`react`, `nextjs`, etc.), so the filter never matched. Now passing an empty type array means "show all extensions".
- **`--cache-dir` did not scope the working dir** — the working copy at `~/.cna/<base64>` was hardcoded and ignored the user-provided `cacheDir`. Now the working dir is colocated under the `cacheDir` when one is set, otherwise falls back to `~/.cna/`.
