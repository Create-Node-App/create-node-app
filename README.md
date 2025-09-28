<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">
<h1>🌟 Create Awesome Node App 🚀</h1>

[Changelog](./packages/create-awesome-node-app/CHANGELOG.md) |
[Contributing](./CONTRIBUTING.md)

</div>
<div align="center">

[![Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite#get-started)
[![Continuous Integration][cibadge]][ciurl]
[![npm][npmversion]][npmurl]
[![npm][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]
[![Coverage](./.github/badges/coverage.svg)](#-available-scripts)

</div>

This repository contains the source code for the `create-awesome-node-app` package. ✨

![cna](https://user-images.githubusercontent.com/17727170/229553510-49d0d46f-11ac-4b07-acf3-8db8ce7959ec.gif)

## 🚀 Available Scripts

In the project directory, you can run:

| `npm run <script>` | Description                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `test`             | Runs unit tests with Jest.                                                                                              |
| `lint`             | 🚦 [Lints](http://stackoverflow.com/questions/8503559/what-is-linting) the project for potential errors                 |
| `lint:fix`         | Lints the project and [fixes all correctable errors](http://eslint.org/docs/user-guide/command-line-interface.html#fix) |
| `format`           | Formats the project using [Prettier](https://prettier.io/)                                                              |
| `type-check`       | Runs [TypeScript](https://www.typescriptlang.org/) type checking                                                        |

## Running Locally

When contributing you might want to test your changes locally before opening a PR. To do so, you can use the `create-awesome-node-app` CLI to create a new project and test your changes.

```sh
# Clone the repository
git clone https://github.com/Create-Node-App/create-node-app.git

# Move into the directory
cd create-node-app

# Setup your local environment
fnm use
npm install

# Build the CLI
npm run build -- --filter create-awesome-node-app

# Create a new project
./packages/create-awesome-node-app/index.js my-app
```

### More Usage Examples

Below are additional real-world examples leveraging the public templates catalog and local `file://` paths.

#### 1. Use a catalog template by slug (non-interactive)

Create a React + Vite project (slug: `react-vite-boilerplate`):

```sh
npx create-awesome-node-app my-react-app -t react-vite-boilerplate
```

Create a NestJS API (slug: `nestjs-boilerplate`):

```sh
npx create-awesome-node-app my-nest-api -t nestjs-boilerplate
```

Create a Next.js full‑stack app (slug: `nextjs-starter`) with a custom `srcDir` override:

```sh
npx create-awesome-node-app my-next --template nextjs-starter --srcDir app
```

#### 2. Add extensions (addons) by slug

React project with Tailwind CSS + Zustand state management (extensions `tailwind-css` and `zustand`):

```sh
npx create-awesome-node-app my-react-app -t react-vite-boilerplate --addons tailwind-css zustand
```

NestJS project with Drizzle (PostgreSQL) + OpenAPI docs:

```sh
npx create-awesome-node-app my-nest-api -t nestjs-boilerplate --addons drizzle-orm-postgresql openapi
```

#### 3. Mix template + explicit extension URLs

You can always pass full GitHub URLs (they can include `/tree/<branch>/<subdir>`):

```sh
npx create-awesome-node-app my-app \
  -t https://github.com/Create-Node-App/cna-templates/tree/main/templates/react-vite-starter \
  --addons https://github.com/Create-Node-App/cna-templates/tree/main/extensions/react-query
```

#### 4. Local development with `file://` URLs (templates & extensions)

When iterating on your own template or extension locally, point the CLI to a folder on disk. This is useful while building new starters before publishing.

Supported forms:

```sh
# Basic local template (directory contains a template/ or direct files)
npx create-awesome-node-app local-app \
  -t file:///absolute/path/to/my-template

# Local template selecting a subdirectory (instead of putting /tree/<branch>/<subdir>)
npx create-awesome-node-app local-app \
  -t "file:///absolute/path/to/monorepo?subdir=templates/react-vite-starter"

# Combine a local template with a local extension
npx create-awesome-node-app local-app \
  -t file:///absolute/path/to/my-template \
  --addons file:///absolute/path/to/my-extension
```

Notes for local usage:

- `file://` templates do not perform any git clone; files are read directly from disk.
- Optional query `?subdir=relative/path` lets you target a nested directory inside a local repo.
- You can add `?ignorePackage=true` to ignore a template's `package.json` (useful when only copying files).

#### 5. Append additional extensions with `--extend`

`--extend` appends more raw URLs or slugs after initial template + addons resolution (handy for layering):

```sh
npx create-awesome-node-app layered-app \
  -t react-vite-boilerplate \
  --addons tailwind-css \
  --extend https://github.com/Create-Node-App/cna-templates/tree/main/extensions/react-hook-form
```

#### 6. Verbose mode for debugging

Add `--verbose` to see template resolution, first discovered file, prepared operations count, and copy/append actions:

```sh
npx create-awesome-node-app debug-app -t react-vite-boilerplate --verbose
```

### Template Catalog Reference (Excerpt)

Some popular template slugs available right now:

| Slug                              | Description                          |
| --------------------------------- | ------------------------------------ |
| `react-vite-boilerplate`          | React + Vite + TypeScript + Router   |
| `nextjs-starter`                  | Production-ready Next.js starter     |
| `nestjs-boilerplate`              | Scalable NestJS backend              |
| `turborepo-boilerplate`           | Monorepo with Turborepo + Changesets |
| `web-extension-react-boilerplate` | React WebExtension with Vite         |
| `webdriverio-boilerplate`         | WebdriverIO testing setup            |

(Full catalog fetched from: `https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json`.)

### Extension Slug Examples (React)

| Slug                                 | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `tailwind-css`                       | Tailwind CSS utility-first styling    |
| `zustand`                            | Lightweight state management          |
| `react-query` (tanstack-react-query) | Async server state management         |
| `react-i18n`                         | Internationalization setup            |
| `shadcn-ui`                          | Radix + Tailwind component primitives |
| `material-ui`                        | MUI component library                 |

You can combine multiple in one command via `--addons`.

### Ignoring `package.json` from a template

If you only want the file structure (not the template's `package.json`), append `?ignorePackage=true`:

```sh
npx create-awesome-node-app structure-only \
  -t "https://github.com/Create-Node-App/cna-templates/tree/main/templates/react-vite-starter?ignorePackage=true"
```

### Using a Different Source Directory

Most templates expose a `srcDir` custom option. Override it like this:

```sh
npx create-awesome-node-app custom-src -t react-vite-boilerplate --srcDir app
```

### Import Path Alias

Likewise override the import alias (defaults often `@/`):

```sh
npx create-awesome-node-app custom-alias -t react-vite-boilerplate --projectImportPath "~/"
```

---

## 🤝 Contributing

- Contributions make the open source community such an amazing place to learn, inspire, and create.
- Any contributions you make are **truly appreciated**.
- Check out our [contribution guidelines](./CONTRIBUTING.md) for more information.

[cibadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg
[ciurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE

> Coverage badge is generated locally (c8 + lcov) and updated when running `npm run test:coverage`. For external reporting (Codecov/Coveralls) a future enhancement can publish the lcov report.
