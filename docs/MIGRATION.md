# Migration Guide

How to keep a scaffolded project aligned with improvements in `create-awesome-node-app` and [cna-templates](https://github.com/Create-Node-App/cna-templates).

## Why migration is hard

`create-awesome-node-app` generates a **one-time snapshot** of a template plus extensions. After scaffolding, the CLI does not maintain a live link to your project. You own every file and dependency choice going forward.

That is by design — generated projects should be independent — but it means updates require deliberate effort.

## Strategy 1: Manual dependency updates

1. Run `npm outdated` (or `pnpm outdated` / `yarn outdated`) in your project.
2. Enable Dependabot if you used the `all-github-setup` extension (see its workflow in cna-templates).
3. Compare your `package.json` scripts and devDependencies with the current template in [cna-templates](https://github.com/Create-Node-App/cna-templates/tree/main/templates).

## Strategy 2: Diff against a fresh scaffold

Scaffold a new project with the same template and extensions, then diff:

```bash
npx create-awesome-node-app my-project-new \
  -t <template-slug> \
  --addons <extension-slugs> \
  --no-install

diff -r my-project/ my-project-new/ \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=.next
```

Review differences in config files (`eslint.config.mjs`, `tsconfig.json`, CI workflows) and port changes selectively.

## Strategy 3: Selective re-scaffolding

For a single extension update:

1. Scaffold a throwaway project with only that extension applied.
2. Copy the extension-specific files into your existing project (e.g. Drizzle schema, auth routes).
3. Merge `package.json` dependency changes manually.

## CLI version changelog

Track releases for template and extension changes:

- [create-node-app releases](https://github.com/Create-Node-App/create-node-app/releases)
- [cna-templates releases](https://github.com/Create-Node-App/cna-templates/releases)

When upgrading the CLI globally:

```bash
npm install -g create-awesome-node-app@latest
# or prefer npx without global install:
npx create-awesome-node-app@latest --help
```

## Adding extensions to an existing project

There is no `cna add-extension` command yet. To add an extension after the fact:

1. Browse the extension in [cna-templates/extensions](https://github.com/Create-Node-App/cna-templates/tree/main/extensions).
2. Read the extension README for required files and dependencies.
3. Scaffold a minimal project with that extension and copy the relevant files.
4. Install matching dependencies from the extension's `package.json`.

## Getting help

- [Troubleshooting](./TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/Create-Node-App/create-node-app/issues)
- [Discussions](https://github.com/Create-Node-App/cna-templates/discussions)
