# Security Policy

## Threat Model

`create-awesome-node-app` is a code-generation tool. By design, it downloads and
executes templates from remote sources. This inherent trust model means that a
malicious template (or a compromised template repository) can execute arbitrary
code on the user's machine or exfiltrate sensitive data.

## What We Do

- Templates are fetched over HTTPS and cached locally. Cache entries are
  verified with `git fsck` via `cna cache verify`.
- File copy uses reflinks or hardlinks where available; no post-copy execution
  happens outside the explicitly declared `package` hook (see below).
- Catalog fetches (template registry) include a 10-second timeout and a
  descriptive `User-Agent` header.
- The `cna.config.json` loader rejects `type: "invisible"` and `type: "password"`
  prompt types to prevent covert input harvesting by templates.

## What You Should Do

### Prefer hash-pinned URLs for untrusted templates

When using a template or extension from an untrusted source, pin it to a
specific commit SHA:

```bash
create-awesome-node-app my-app \
  --template https://github.com/owner/repo/tree/main/path?ref=abc123def456abc123def456abc123def456abc1
```

This prevents a future commit to the same branch from executing on your
machine without your knowledge. Set `CNA_STRICT_REPRO=1` to enforce that all
`ref` parameters are full 40-character hex SHAs.

### The `package` script execution surface

Templates can ship a `package.js` (or `.cjs`) module that is loaded and
executed by `@create-node-app/core` during scaffolding. This module receives
the merged configuration (including `--set` values, package manager, app name)
and can modify the generated `package.json`, add dependencies, or run
side-effects.

This is a **deliberate feature** of the composable template system. Before
using a template, audit its `package` module:

```bash
# After cloning, inspect the template's package module
ls <cache>/<template-id>/
<editor> <cache>/<template-id>/package.js
```

### Network calls

The CLI makes the following outbound HTTP calls:

| Call | Purpose | Timeout | User-Agent |
|------|---------|---------|------------|
| `registry.npmjs.org` | Version check (`dist-tags`) | 10 s | `create-node-app-core/<version>` |
| `raw.githubusercontent.com` | Template catalog `templates.json` | 10 s | `create-awesome-node-app/<version>` |
| `github.com` | Template clone (via `git`) | (git default) | `git/` (system `user-agent`) |
| Various (via `npm install`) | Dependency install | (npm default) | `npm/` (system `user-agent`) |

## Reporting a Vulnerability

If you find a security issue in the CLI itself, please open a
[GitHub Security Advisory](https://github.com/Create-Node-App/create-node-app/security/advisories/new)
rather than a public issue.

For vulnerabilities in templates or extensions published through the
[cna-templates](https://github.com/Create-Node-App/cna-templates) registry,
please open an issue in that repository.

We aim to acknowledge reports within 48 hours and ship a fix within 7 days
for medium-severity issues.
