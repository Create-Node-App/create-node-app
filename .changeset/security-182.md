---
"@create-node-app/core": patch
"create-awesome-node-app": patch
---

Security hardening (closes #182)

- **F5 — Fetch timeout and user-agent**: dist-tags fetch in `core/index.ts` now uses `AbortSignal.timeout(10_000)` and a descriptive `User-Agent` header. `CNA_USER_AGENT` and `CNA_CORE_VERSION` are exported from `@create-node-app/core`.
- **F2 — Prompt type restriction**: custom options in `cna.config.json` with `type: "invisible"` or `type: "password"` are skipped with a console warning, preventing config-file-driven prompt harvesting.
- **F1 — Security policy**: new `SECURITY.md` covering the template RCE threat model, hash-pinned URL best practices, network call inventory, and vulnerability reporting.
