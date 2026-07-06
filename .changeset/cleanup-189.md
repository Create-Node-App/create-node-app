---
"create-awesome-node-app": patch
"@create-node-app/core": patch
---

Cleanup (closes #189)

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
