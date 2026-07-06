---
"create-awesome-node-app": patch
"@create-node-app/core": patch
---

Concurrency safety improvements (closes #185)

- **C4 — `try/finally` around cwd change**: `createApp` in
  `installer.ts` now restores the original working directory after `run()`
  completes or throws. Added `return await` to ensure the `finally` block
  fires after the async pipeline settles.
- **C3 — `Promise.all` → `Promise.allSettled`**: `loadFiles` in
  `loaders.ts` now collects all copy failures instead of failing fast on
  the first one. If any operation rejects, a single error listing all
  failures is thrown.
