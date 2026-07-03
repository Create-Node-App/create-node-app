<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">

<img src="https://raw.githubusercontent.com/Create-Node-App/create-node-app/main/packages/create-awesome-node-app/assets/hero.svg" alt="Create Awesome Node App banner" width="100%" />

# Create Awesome Node App

**🚀 Generate production-ready apps by composing templates, addons, and AI-ready conventions.**

From blank folder to working Node/Web project with modern tooling, clean defaults, and team-friendly automation.

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![Stars][starsbadge]][starsurl]
[![License: MIT][licensebadge]][licenseurl]

[![Tests][testsbadge]][testsurl]
[![Lint][lintbadge]][linturl]
[![Typecheck][typecheckbadge]][typecheckurl]
[![Markdown][markdownlintbadge]][markdownlinturl]
[![Shellcheck][shellcheckbadge]][shellcheckurl]
[![Commit Activity][commitactivitybadge]][commitactivityurl]
[![Bundle Size][bundlesizebadge]][bundlesizeurl]

**[Official Site](https://create-awesome-node-app.vercel.app)** · [Templates](https://create-awesome-node-app.vercel.app/templates) · [Extensions](https://create-awesome-node-app.vercel.app/extensions) · [Docs](https://create-awesome-node-app.vercel.app/docs) · [GitHub](https://github.com/Create-Node-App/create-node-app) · [npm](https://www.npmjs.com/package/create-awesome-node-app)

</div>

---

## ⚡ Start In 30 Seconds

```bash
npm create awesome-node-app@latest my-app
```

Interactive by default outside CI. For automation, run headless with flags:

```bash
npx create-awesome-node-app my-app \
  --template react-vite-boilerplate \
  --addons tailwind-css zustand github-setup \
  --use-bun \
  --no-interactive
```

| If you want...                | Start here                                        |
|-------------------------------|---------------------------------------------------|
| A guided local setup          | `npm create awesome-node-app@latest my-app`       |
| A repeatable CI/platform flow | `--no-interactive` with explicit flags            |
| Your company starter          | `--template <github-url>` or `--template file://` |
| Private standards layered in  | `--extend <url>`                                  |

---

## ✨ Why CNA?

| Capability                        | Value                                                                                                 |
|-----------------------------------|-------------------------------------------------------------------------------------------------------|
| 🧩 **Composable by design**       | Start with a template, then layer only the addons your project actually needs.                        |
| 🛡️ **Production-ready defaults** | TypeScript, linting, scripts, testing paths, and practical DX defaults out of the box.                |
| 🤖 **AI-ready from day one**      | Supported templates generate `AGENTS.md` so coding agents understand the project context.             |
| 🏗️ **CI and platform friendly**  | Use `--no-interactive`, `--set`, `--template <url>`, and `--extend <url>` for repeatable scaffolding. |

---

## 🧬 Composition Model

```text
template -> addons -> custom options -> install -> git init -> AI-ready project
```

You can mix catalog templates and addons with your own GitHub or `file://` sources.

---

## 🎛️ What You Can Generate

### 🧱 Template Families

| Category      | Example templates                                           |
|---------------|-------------------------------------------------------------|
| Frontend      | `react-vite-boilerplate`, `astro-starter`                   |
| Backend       | `nestjs-boilerplate`, `hono-starter`                        |
| Full Stack    | `nextjs-starter`, `nextjs-saas-ai-starter`, `remix-starter` |
| Monorepo      | `turborepo-boilerplate`                                     |
| Web Extension | `web-extension-react-boilerplate`                           |
| UAT / Testing | `webdriverio-boilerplate`                                   |

### 🧰 Addon Families

| Category                  | Examples                                                                  |
|---------------------------|---------------------------------------------------------------------------|
| UI                        | `tailwind-css`, `material-ui`, `shadcn-ui`, `nextjs-shadcn`               |
| State and data            | `zustand`, `jotai`, `tanstack-react-query`, `apollo-client`               |
| Backend and DB            | `drizzle-orm-postgresql`, `drizzle-orm-sqlite`, `mongoose-orm-mongodb`    |
| Next.js stack             | `nextjs-auth`, `nextjs-trpc`, `nextjs-drizzle-postgres`, `nextjs-t3-env`  |
| Tooling and quality       | `github-setup`, `husky-lint-staged`, `development-container`, `storybook` |
| Deployment and monitoring | `serverless-framework`, `sentry`                                          |

---

## 🍱 Popular Recipes

### ⚛️ React + Tailwind + Zustand

```bash
npx create-awesome-node-app my-dashboard \
  --template react-vite-boilerplate \
  --addons tailwind-css zustand \
  --no-interactive
```

### ▲ Next.js + shadcn/ui + Auth + tRPC

```bash
npx create-awesome-node-app my-saas \
  --template nextjs-starter \
  --addons nextjs-shadcn nextjs-auth nextjs-trpc github-setup husky-lint-staged \
  --use-pnpm \
  --no-interactive
```

### 🐈 NestJS + Drizzle PostgreSQL + OpenAPI

```bash
npx create-awesome-node-app my-api \
  --template nestjs-boilerplate \
  --addons drizzle-orm-postgresql openapi \
  --no-interactive
```

### 🤖 Next.js SaaS AI Starter

```bash
npx create-awesome-node-app my-ai-saas \
  --template nextjs-saas-ai-starter \
  --use-pnpm \
  --no-interactive
```

### 🏢 Internal Platform Template (GitHub URL)

```bash
npx create-awesome-node-app my-internal-app \
  --template https://github.com/your-org/platform-starters/tree/main/templates/internal-app \
  --no-interactive
```

### 🧪 Local Template Development (`file://`)

```bash
npx create-awesome-node-app my-local-app \
  --template file:///absolute/path/to/platform-starters/templates/internal-app \
  --no-interactive
```

> `file://` template URLs should be absolute paths (for example `file:///Users/...` or `file:///C:/...`).

### 🔒 Layer A Private Extension

```bash
npx create-awesome-node-app my-app \
  --template react-vite-boilerplate \
  --addons tailwind-css \
  --extend https://github.com/your-org/platform-starters/tree/main/extensions/company-ci
```

### 🎚️ Pass Custom Template Values

```bash
npx create-awesome-node-app my-app \
  --template react-vite-boilerplate \
  --set "productName=Acme Cloud" \
  --set "author=Platform Team" \
  --no-interactive
```

---

## 🏗️ Built For Modern Teams

- 🟢 Node 22+ runtime support.
- 📦 npm, yarn, pnpm, and Bun package managers.
- 🧙 Interactive wizard for local workflows.
- 🔁 `--no-interactive` mode for CI, scripts, and platform automation.
- 🌐 GitHub URL and local `file://` template inputs.
- 🔐 `--extend` support for private addon layering.
- 🎯 `--set key=value` overrides for deterministic custom options.

---

## 🔎 Explore The Catalog

Browse visually at **[create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)** or discover from the terminal:

```bash
# List all available templates
npx create-awesome-node-app --list-templates

# List addons compatible with a specific template
npx create-awesome-node-app --template react-vite-boilerplate --list-addons
```

Full catalog:

- **Templates:** [create-awesome-node-app.vercel.app/templates](https://create-awesome-node-app.vercel.app/templates)
- **Extensions:** [create-awesome-node-app.vercel.app/extensions](https://create-awesome-node-app.vercel.app/extensions)

---

## 🤖 AI-Ready With `AGENTS.md`

Supported templates can generate an `AGENTS.md` file so coding assistants understand project context before editing:

| Context                | Why it matters                                              |
|------------------------|-------------------------------------------------------------|
| Project purpose        | Agents understand what the app is for before changing code. |
| Directory layout       | Suggestions align with the real structure.                  |
| Scripts and validation | Agents know how to lint, test, build, and verify changes.   |
| Team conventions       | Output follows naming and workflow expectations.            |

Learn more: **[AGENTS.md guide](https://create-awesome-node-app.vercel.app/docs/agents-md)**

---

## 🧙 Interactive Wizard

Run the CLI without flags and CNA guides you through:

| Step              | What you choose                                                            |
|-------------------|----------------------------------------------------------------------------|
| Project name      | Confirm or set the target directory                                        |
| Package manager   | npm, yarn, pnpm, or Bun                                                    |
| Category          | Frontend, Backend, Full Stack, Monorepo, Web Extension, UAT, or custom URL |
| Template          | Pick from curated starters with descriptions and labels                    |
| Addons            | Multi-select compatible extensions grouped by purpose                      |
| Custom extensions | Layer extra URLs for internal standards                                    |

---

## ✅ Requirements

- **Node.js >= 22**
- npm >= 7, yarn, pnpm, or Bun

Recommended quick switch:

```bash
fnm use 22
npm create awesome-node-app@latest my-app
```

---

## 🧭 CLI Reference

```text
Usage: create-awesome-node-app [project-directory] [options]
```

| Flag                         | Description                                           |
|------------------------------|-------------------------------------------------------|
| `--interactive`              | Force interactive wizard (default outside CI)         |
| `--no-interactive`           | Disable wizard and use flags only                     |
| `-t, --template <slug\|url>` | Template slug from catalog or remote/local URL        |
| `--addons [slugs...]`        | Space-separated addon slugs or URLs                   |
| `--extend [urls...]`         | Extra extension URLs layered on top                   |
| `--set <key=value...>`       | Set custom template options; quote values with spaces |
| `--no-install`               | Generate files without installing dependencies        |
| `-f, --force`                | Allow scaffolding into a non-empty target directory   |
| `--use-yarn`                 | Use yarn instead of npm, pnpm, or Bun                 |
| `--use-pnpm`                 | Use pnpm instead of npm, yarn, or Bun                 |
| `--use-bun`                  | Use Bun instead of npm, yarn, or pnpm                 |
| `--list-templates`           | Print all templates grouped by category               |
| `--list-addons`              | Print addons, optionally filtered by `--template`     |
| `-v, --verbose`              | Output resolved generation config as JSON             |
| `-i, --info`                 | Print Node, npm, and OS diagnostics                   |
| `-V, --version`              | Print CLI version                                     |
| `-h, --help`                 | Show help                                             |

---

## 🧩 Programmatic Usage

Need to integrate CNA into your own tooling? The core is importable:

```ts
import { createNodeApp, getTemplateDirPath } from "@create-node-app/core";
```

> The programmatic API is experimental and subject to change. Prefer the CLI for stable usage.

---

## ❓ FAQ

<details>
<summary><strong>🤔 Why another scaffolder?</strong></summary>

Most scaffolders lock you into one stack. CNA is composable: choose a template, layer focused addons, and plug in your own GitHub/local blueprints.

</details>

<details>
<summary><strong>🏗️ Can I use my own template?</strong></summary>

Yes. Pass a GitHub URL or local `file://` URL with `--template`.

</details>

<details>
<summary><strong>🔒 Can I use private/internal extensions?</strong></summary>

Yes. Use `--extend <url>` to layer private extensions on top of a template and addon set.

</details>

<details>
<summary><strong>🧱 Are addons order-sensitive?</strong></summary>

Yes. Addons are applied in sequence. If two addons modify the same file, later addons win.

</details>

<details>
<summary><strong>📦 Does it support monorepos?</strong></summary>

Yes. Use `turborepo-boilerplate` to bootstrap a multi-package workspace with shared tooling.

</details>

<details>
<summary><strong>🔁 Can I use it in CI?</strong></summary>

Yes. Pass all required flags and use `--no-interactive` for deterministic automation.

</details>

<details>
<summary><strong>🟢 Is Node 22 required?</strong></summary>

Yes. CNA targets Node 22+ to keep runtime behavior modern and predictable.

</details>

<details>
<summary><strong>🤖 Does CNA work with AI coding assistants?</strong></summary>

Yes. Supported templates can generate `AGENTS.md`, helping assistants understand project layout, scripts, and conventions.

</details>

---

## 🗺️ Roadmap

- 🚀 More framework templates and vertical starters.
- 🧪 Additional testing packs for contracts, performance, and load testing.
- 📌 Template version pinning and diff-based upgrade paths.
- 📊 Rich template analytics and usage insights.

Track progress in [Issues](https://github.com/Create-Node-App/create-node-app/issues) and [Discussions](https://github.com/Create-Node-App/create-node-app/discussions).

---

## 🤝 Contributing

Templates, addons, bug fixes, docs, recipes, and ideas are all welcome.

- **Main repo:** [github.com/Create-Node-App/create-node-app](https://github.com/Create-Node-App/create-node-app)
- **Template and extension data:** [github.com/Create-Node-App/cna-templates](https://github.com/Create-Node-App/cna-templates)
- **Contributing guide:** [CONTRIBUTING.md](https://github.com/Create-Node-App/create-node-app/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

---

<div align="center">

**[create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)**

_Built for developers who value speed, composability, color, and AI-ready workflows._

</div>

<!-- Reference links -->

[testsbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/test.yml/badge.svg
[lintbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/lint.yml/badge.svg
[typecheckbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/type-check.yml/badge.svg
[shellcheckbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/shellcheck.yml/badge.svg
[markdownlintbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/markdownlint.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?style=flat-square&color=cb3837
[starsbadge]: https://img.shields.io/github/stars/Create-Node-App/create-node-app?style=flat-square&color=yellow
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[testsurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/test.yml
[linturl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/lint.yml
[typecheckurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/type-check.yml
[shellcheckurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/shellcheck.yml
[markdownlinturl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/markdownlint.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
[starsurl]: https://github.com/Create-Node-App/create-node-app/stargazers
[commitactivitybadge]: https://img.shields.io/github/commit-activity/m/Create-Node-App/create-node-app?style=flat-square&logo=github&label=commits
[commitactivityurl]: https://github.com/Create-Node-App/create-node-app/pulse
[bundlesizebadge]: https://img.shields.io/bundlephobia/minzip/create-awesome-node-app?style=flat-square&label=size
[bundlesizeurl]: https://bundlephobia.com/package/create-awesome-node-app
