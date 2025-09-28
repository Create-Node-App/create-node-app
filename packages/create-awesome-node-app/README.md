<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">
<h1>🌟 Create Awesome Node App 🚀</h1>

<strong>The one CLI to bootstrap modern Node.js, Web, Backend, Full‑Stack, Monorepo & Extension projects – in minutes.</strong>

[![Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite#get-started)
[![Tests][testsbadge]][testsurl]
[![Lint][lintbadge]][linturl]
[![Typecheck][typecheckbadge]][typecheckurl]
[![Shellcheck][shellcheckbadge]][shellcheckurl]
[![Markdown][markdownlintbadge]][markdownlinturl]
[![npm][npmversion]][npmurl]
[![npm][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]
<br />
<a href="https://create-awesome-node-app.vercel.app" target="_blank"><b>Official Website</b></a> ·
<a href="https://create-awesome-node-app.vercel.app/templates" target="_blank">Templates</a> ·
<a href="https://create-awesome-node-app.vercel.app/extensions" target="_blank">Extensions</a> ·
<a href="https://create-awesome-node-app.vercel.app/docs" target="_blank">Docs</a>

</div>

> Build. Extend. Ship. Pick a production‑grade template, layer powerful addons, and get a project that follows modern conventions, automation, and DX best practices out of the box.

---

## ✨ Why Create Awesome Node App?

`create-awesome-node-app` (CNA) is a batteries‑included scaffolding CLI that lets you:

- 🔌 Mix & match **templates + addons** (React, Next.js, NestJS, Turborepo, Web Extensions, UAT, Monorepos, and more)
- 🧩 Add **extensions** (UI libraries, GitHub setup, auth, testing, tooling) at creation time
- 🧪 Ship with **testing & linting** pre‑wired (ESLint, TypeScript, formatting, markdown lint, shellcheck, etc.)
- 🧭 Use **interactive mode** to discover categories, templates, and compatible addons
- 🚀 Start fast with **production‑ready structure** and opinionated defaults
- 🤖 Get an automatic **`AGENTS.md` contract** in supported templates for AI assistant alignment
- 🌐 Pull **remote templates / extensions by URL** – bring your own blueprints
- 🧵 Keep everything **Node 22 ready** and future‑proof

> On the Awesome List? ✅ Yes – we proudly display the [Awesome Vite Mention](https://github.com/vitejs/awesome-vite#get-started).

---

## 🔗 Official Site

Explore visually: **[create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)**

- Browse all templates & categories
- Filter by stack type (frontend, backend, full‑stack, monorepo, web extension, UAT, etc.)
- Discover extensions to enrich your base
- Learn how the generation pipeline works

---

## 🚀 Quick Start

Use via one‑shot runner (recommended – always latest):

```bash
npm create awesome-node-app@latest my-app -- --interactive
# or
pnpm create awesome-node-app my-app --interactive
# or
yarn create awesome-node-app my-app --interactive
```

Global install (optional):

```bash
npm install -g create-awesome-node-app
create-awesome-node-app my-app --template react-vite-boilerplate --addons material-ui github-setup
```

Minimal non‑interactive example:

```bash
npx create-awesome-node-app my-api \
  --template nestjs-boilerplate \
  --addons github-setup commitlint prettier
```

---

## 🧪 Interactive Mode Walkthrough

Launch with `--interactive` to:

1. Pick a category (Frontend, Backend, Full Stack, Monorepo, Web Extension, UAT...)
2. Select a template with description & keywords
3. Choose compatible extensions grouped by purpose
4. Optionally extend with custom URLs

The CLI builds a tailored `templatesOrExtensions` pipeline and generates the workspace accordingly.

---

## 🧱 Template Ecosystem (Highlights)

| Category      | Example Templates                                 |
| ------------- | ------------------------------------------------- |
| Frontend      | React Vite Boilerplate, Vue (via community), etc. |
| Backend       | NestJS Boilerplate, Express variants              |
| Full Stack    | NextJS Starter (SSR + TS + ESLint + Prettier)     |
| Monorepo      | Turborepo Boilerplate (TypeScript + Changesets)   |
| Web Extension | Cross‑browser modern extension bases              |
| UAT / Testing | Playwright / Cypress ready setups                 |

Full catalog: <https://create-awesome-node-app.vercel.app/templates>

---

## 🧩 Addons / Extensions

Enhance your template with modular capabilities (examples):

- UI: Material UI, Tailwind, component libraries
- State / Data: jotai, tRPC, React Query
- Tooling: GitHub workflows, commit linting, changesets, release automation
- Quality: ESLint configs, Prettier, TypeScript strictness
- Testing: Playwright / Cypress scaffolds, vitest
- DX: Environment setup, conventional commits, docs helpers

List what’s available:

```bash
create-awesome-node-app --list-templates
create-awesome-node-app --list-addons
# Filter addons compatible with a template
create-awesome-node-app --template react-vite-boilerplate --list-addons
```

Add any extra extension by URL:

```bash
create-awesome-node-app my-app \
  --template react-vite-boilerplate \
  --addons material-ui github-setup \
  --extend https://github.com/your-org/your-extension
```

---

## 🤖 AGENTS.md: Built-in AI Assistant Contract

Many templates ship with an auto‑generated `AGENTS.md` – a structured guide for AI coding assistants to understand project intent, conventions, and constraints. This improves code suggestion relevance and onboarding speed for hybrid human+AI teams.

Learn more: <https://create-awesome-node-app.vercel.app/docs/agents-md>

---

## ⚙️ Requirements

- **Node.js ≥ 22** (enforced via engine check)
- Any of: npm / yarn / pnpm

We recommend fast version switching with [`fnm`](https://github.com/Schniz/fnm):

```bash
fnm use 22
```

---

## 🔍 CLI Options (Core)

| Flag                        | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `--interactive`             | Guided selection flow (templates + addons)     |
| `--template <slug\|url>`    | Use a known template slug or remote URL        |
| `--addons [list...]`        | Space‑separated addon slugs or URLs            |
| `--extend [list...]`        | Extra extension URLs (advanced)                |
| `--no-install`              | Skip dependency installation                   |
| `--use-yarn` / `--use-pnpm` | Force package manager                          |
| `--list-templates`          | Print templates grouped by category            |
| `--list-addons`             | Print addons (optionally filtered by template) |
| `--verbose`                 | Output resolved generation config              |
| `--info`                    | Print environment diagnostics                  |

---

## 🛠 Programmatic Usage (Experimental)

You can import helpers from the core package for custom tooling:

```ts
import { createNodeApp, getTemplateDirPath } from "@create-node-app/core";
```

---

## 🧪 Quality & Toolchain

Every generated project leans on modern, maintainable defaults:

- TypeScript strict mode
- ESLint (framework‑specific presets + consistency rules)
- Prettier formatting (where applicable)
- Testing support (varies by template: vitest, jest, e2e tooling)
- GitHub Actions friendly
- Conventional structure for CI/CD & release automation

---

## ❓ FAQ

**Why another scaffolder?**
Because most CLIs lock you into one stack. CNA lets you compose _your_ stack from curated templates + pluggable extensions.

**Can I bring my own template?**
Yes – pass a GitHub (or any) URL pointing to a repository (optionally with subdirectory path) via `--template`.

**Are addons order‑sensitive?**
They’re applied sequentially; conflicting changes should be resolved by your VCS if you customize heavily.

**Does it support monorepos?**
Yes. The Turborepo boilerplate + addons give you multi‑package orchestration fast.

**What about AI integration?**
`AGENTS.md` provides a structured spec for AI tools to align with your conventions.

**Is Node 22 required?**
Yes – we target the latest stable modern runtime for performance & language features.

---

## 🤝 Contributing

We welcome templates, addons, fixes, and ideas! See the root repository guidelines: <https://github.com/Create-Node-App/create-node-app/blob/main/CONTRIBUTING.md>

For template & extension data visit: <https://github.com/Create-Node-App/cna-templates>

---

## Roadmap (Short List)

- More framework integrations (Remix, SvelteKit variants)
- Additional testing packs (contract / performance harnesses)
- Rich analytics for generation metrics
- Template version pinning & diff upgrade paths

Follow progress in Issues & Discussions.

---

## 📜 License

MIT © Create Node App Contributors – see [LICENSE][licenseurl]

---

<div align="center">
<sub>Built with ♥ for developers who value velocity + clarity.</sub>
</div>

[testsbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/test.yml/badge.svg
[lintbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/lint.yml/badge.svg
[typecheckbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/type-check.yml/badge.svg
[shellcheckbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/shellcheck.yml/badge.svg
[markdownlintbadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/markdownlint.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg
[testsurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/test.yml
[linturl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/lint.yml
[typecheckurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/type-check.yml
[shellcheckurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/shellcheck.yml
[markdownlinturl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/markdownlint.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
