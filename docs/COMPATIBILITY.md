# Compatibility

Runtime and distribution requirements for `create-awesome-node-app`, plus how
CLI versions relate to template content.

## Runtime requirements

| Component        | Requirement  | Where it is declared                              |
|------------------|--------------|---------------------------------------------------|
| Node.js (CLI)    | `>= 22.0.0`  | `packages/create-awesome-node-app/package.json`   |
| Node.js (repo)   | `>= 24.17.0` | Root `package.json` (development only)            |
| npm (repo/CI)    | `>= 11.13.0` | Root `package.json` (development only)            |
| npm (CI images)  | 11.x         | `.github/workflows/ci-*.yml` pin `npm@11`         |

Notes:

- The **published CLI runs on Node 22+**. The stricter Node 24 / npm 11
  floor applies to **developing this repo**, not to end users.
- npm 11 is required in CI because npm 10's arborist crashes with
  `Cannot read properties of null (reading 'edgesOut')` on vitest 4 and
  on workspace templates such as `turborepo-starter`
  ([cna-templates#408](https://github.com/Create-Node-App/cna-templates/issues/408)).
  End users on npm 10 may hit the same crash when scaffolding those
  templates — upgrading npm (`npm install -g npm@11`) fixes it.

## Distribution

| Channel  | Notes                                                        |
|----------|--------------------------------------------------------------|
| npm      | `create-awesome-node-app` (versioned via changesets)         |
| Homebrew | `Create-Node-App/tap`; requires Homebrew 4.x-compatible     |
|          | formula (no `Language::Node.std_npm_args`, removed in 4.x)   |
| AUR      | Community package, synced from npm releases                  |
| Docker   | Published alongside releases                                 |

There are no GitHub Releases — npm is the source of truth for versions.

## CLI ↔ templates versioning

- The CLI resolves the template/extension catalog from
  [`cna-templates`](https://github.com/Create-Node-App/cna-templates)
  `main` at scaffold time (subject to the on-disk cache).
- Template content is **not pinned** to CLI versions. For reproducible
  scaffolds, pin a ref explicitly:

```bash
create-awesome-node-app my-app --template react-vite-starter --pin <sha-or-tag>
```

- The reverse is also true: template changes (new extensions, dependency
  bumps) take effect for all CLI versions without a CLI release.
