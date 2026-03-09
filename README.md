<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">

<h1>🌟 Create Awesome Node App</h1>

<p><strong>A composable scaffolding CLI for Node, Web, Full-Stack, and Monorepo projects.</strong><br/>
Pick a template. Layer addons. Ship production-ready code in minutes.</p>

[![Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite#get-started)
[![Tests][testsbadge]][testsurl]
[![Lint][lintbadge]][linturl]
[![Typecheck][typecheckbadge]][typecheckurl]
[![Shellcheck][shellcheckbadge]][shellcheckurl]
[![Markdown][markdownlintbadge]][markdownlinturl]
[![npm][npmversion]][npmurl]
[![npm][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]
[![Coverage](./.github/badges/coverage.svg)](#-available-scripts)

[Changelog](./packages/create-awesome-node-app/CHANGELOG.md) · [Contributing](./CONTRIBUTING.md) · [**🌐 Official Site**](https://create-awesome-node-app.vercel.app)

</div>

---

This repository contains the source code for the [`create-awesome-node-app`](https://www.npmjs.com/package/create-awesome-node-app) CLI — a composable scaffolding tool that generates production-grade Node/Web/Full-Stack projects by combining curated templates with modular extensions.

> **End users:** See the [package README](./packages/create-awesome-node-app/README.md) or visit **[create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)** for the full feature tour, template catalog, and docs.

![cna demo](https://user-images.githubusercontent.com/17727170/229553510-49d0d46f-11ac-4b07-acf3-8db8ce7959ec.gif)

---

## 🗂 Repository Structure

This is a **monorepo** managed with npm workspaces and [Turborepo](https://turbo.build/):

| Package                                                         | Description                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| [`create-awesome-node-app`](./packages/create-awesome-node-app) | The main CLI — Commander-based, interactive + CI-friendly    |
| [`@create-node-app/core`](./packages/create-node-app-core)      | Core generation logic (template loading, git, package merge) |
| `@create-node-app/eslint-config*`                               | Shared ESLint presets (base, TypeScript, React, Next.js)     |
| `tsconfig`                                                      | Shared TypeScript base configurations                        |

---

## 🚀 Quick Start (for users)

```bash
npm create awesome-node-app@latest my-app
```

Or non-interactive:

```bash
npx create-awesome-node-app my-app \
  --template react-vite-boilerplate \
  --addons material-ui github-setup \
  --no-interactive
```

→ Full documentation at **[create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)**

---

## 🛠 Running Locally (for contributors)

```sh
# Clone the repository
git clone https://github.com/Create-Node-App/create-node-app.git
cd create-node-app

# Set up Node version and install dependencies
fnm use
npm install

# Build the CLI
npm run build -- --filter create-awesome-node-app

# Run it locally
./packages/create-awesome-node-app/index.js my-app
```

### Usage Examples

#### Catalog template by slug

```sh
# React + Vite
npx create-awesome-node-app my-react-app -t react-vite-boilerplate

# NestJS API
npx create-awesome-node-app my-api -t nestjs-boilerplate

# Next.js full-stack
npx create-awesome-node-app my-next -t nextjs-starter
```

#### Template + addons

```sh
# React + Tailwind + Zustand
npx create-awesome-node-app my-app \
  -t react-vite-boilerplate \
  --addons tailwind-css zustand

# NestJS + Drizzle + OpenAPI
npx create-awesome-node-app my-api \
  -t nestjs-boilerplate \
  --addons drizzle-orm-postgresql openapi
```

#### Remote GitHub URLs

```sh
npx create-awesome-node-app my-app \
  -t https://github.com/Create-Node-App/cna-templates/tree/main/templates/react-vite-starter \
  --addons https://github.com/Create-Node-App/cna-templates/tree/main/extensions/react-query
```

#### Local `file://` templates (useful when developing new templates)

```sh
# Basic local template
npx create-awesome-node-app local-app \
  -t file:///absolute/path/to/my-template

# Local template with subdirectory
npx create-awesome-node-app local-app \
  -t "file:///absolute/path/to/monorepo?subdir=templates/my-starter"

# Combine local template + local extension
npx create-awesome-node-app local-app \
  -t file:///absolute/path/to/my-template \
  --addons file:///absolute/path/to/my-extension
```

#### Layer extra extensions with `--extend`

```sh
npx create-awesome-node-app layered-app \
  -t react-vite-boilerplate \
  --addons tailwind-css \
  --extend https://github.com/Create-Node-App/cna-templates/tree/main/extensions/react-hook-form
```

#### Debug with `--verbose`

```sh
npx create-awesome-node-app debug-app -t react-vite-boilerplate --verbose
```

---

### Template Catalog Reference (Excerpt)

| Slug                              | Description                          |
| --------------------------------- | ------------------------------------ |
| `react-vite-boilerplate`          | React + Vite + TypeScript + Router   |
| `nextjs-starter`                  | Production-ready Next.js starter     |
| `nestjs-boilerplate`              | Scalable NestJS backend              |
| `turborepo-boilerplate`           | Monorepo with Turborepo + Changesets |
| `web-extension-react-boilerplate` | React WebExtension with Vite         |
| `webdriverio-boilerplate`         | WebdriverIO E2E testing setup        |

Full catalog: **[create-awesome-node-app.vercel.app/templates](https://create-awesome-node-app.vercel.app/templates)**

---

### Popular Extensions (React)

| Slug           | Purpose                               |
| -------------- | ------------------------------------- |
| `tailwind-css` | Tailwind CSS utility-first styling    |
| `zustand`      | Lightweight state management          |
| `react-query`  | Async server state (TanStack Query)   |
| `shadcn-ui`    | Radix + Tailwind component primitives |
| `material-ui`  | MUI component library                 |
| `react-i18n`   | Internationalization setup            |

---

## 📋 Available Scripts

| `npm run <script>` | Description                                   |
| ------------------ | --------------------------------------------- |
| `test`             | Run unit tests with Node's native test runner |
| `lint`             | Lint the project with ESLint                  |
| `lint:fix`         | Lint and auto-fix correctable errors          |
| `format`           | Format with Prettier                          |
| `type-check`       | TypeScript type checking across all packages  |
| `build`            | Build all packages with Turborepo             |

> Coverage badge is generated locally via c8 + lcov when running `npm run test:coverage`.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions are **truly appreciated**!

- Check out the [contribution guidelines](./CONTRIBUTING.md) for how to get started
- Browse [open issues](https://github.com/Create-Node-App/create-node-app/issues) for things to work on
- For template and extension contributions, see [cna-templates](https://github.com/Create-Node-App/cna-templates)

---

<div align="center">

**[🌐 create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)**

</div>

<!-- Reference links -->

[testsbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/test.yml/badge.svg
[lintbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/lint.yml/badge.svg
[typecheckbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/type-check.yml/badge.svg
[shellcheckbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/shellcheck.yml/badge.svg
[markdownlintbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/markdownlint.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?style=flat-square&color=cb3837
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[testsurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/test.yml
[linturl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/lint.yml
[typecheckurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/type-check.yml
[shellcheckurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/shellcheck.yml
[markdownlinturl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/markdownlint.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
