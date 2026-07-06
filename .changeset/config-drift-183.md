---
"create-awesome-node-app": patch
"@create-node-app/core": patch
---

Config drift alignment (closes #183)

- **AGENTS.md**: corrected from `pnpm 10+` to `npm 10+` — the repo uses
  `npm` workspaces with `packageManager: "npm@10.9.2"`.
- **Dev container**: `VARIANT` bumped from `18` to `22` so contributors
  get a Node 22 shell by default.
- **Engines**: `engines.npm` tightened from `>=7.0.0` (irrelevant — npm 7
  is below the bundled npm 10 in Node 22) to `>=10.9.2`, matching
  `packageManager`.
- **MegaLinter**: re-enabled `REPOSITORY_GITLEAKS` (disabled without
  explanation alongside `CHECKOV`, `GRYPE`, `TRIVY` which are heavy
  scanners; Gitleaks is lightweight secret detection).
- **README**: added Node 22 LTS and npm 10 badges in the badge row.
