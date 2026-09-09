---
'@create-node-app/core': minor
---

New public helpers `loadCnaConfigFromPath()` (fail-fast external config
loading) and `loadFiles()` plus the `logStep()` progress printer.
Fixes `.if-<pm>` manager-suffix filtering for trailing suffixes (e.g.
`pnpm-workspace.yaml.if-pnpm` no longer leaks into other managers'
scaffolds).
