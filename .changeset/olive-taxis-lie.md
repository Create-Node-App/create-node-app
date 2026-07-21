---
"create-awesome-node-app": minor
---

feat: test fixture infrastructure for offline catalog loading

Adds a `fixtures/` directory with a minimal catalog, templates, and
extensions for local testing without network access.

- `fixtures/catalog/templates.json` — minimal catalog (2 templates, 1 extension, 2 categories)
- `fixtures/templates/example-starter/` — template with `cna.config.json`, `template.json`, and scaffoldable files
- `fixtures/extensions/example-addon/` — extension with additive template files

The fixture mode is activated via:

- `CNA_CATALOG_FIXTURE=1` env var
- `--fixture [dir]` CLI flag (accepts optional fixture root path)

When active, `getTemplateData()` loads from the local fixture catalog
instead of fetching from GitHub, enabling fully offline development
and testing.
