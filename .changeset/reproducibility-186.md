---
"create-awesome-node-app": patch
"@create-node-app/core": patch
---

Reproducibility improvements (closes #186)

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
