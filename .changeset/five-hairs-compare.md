---
"create-awesome-node-app": patch
---

feat: cache CLI polish — JSON output and clean confirmation (#257)

Adds `--json` flag to `cache list`, `clean`, `verify`, `outdated`,
`doctor`, and `update` subcommands for machine-readable output.
Adds confirmation prompt to `cache clean` (full clean) to prevent
accidental data loss.
