<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">

<h1>🌟 Create Awesome Node App</h1>

<p><strong>The scaffolding CLI that gets out of your way.</strong><br/>
Pick a production-grade template, layer powerful addons, and ship a fully wired project in under a minute.</p>

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![Stars][starsbadge]][starsurl]
[![Commit Activity][commitactivitybadge]][commitactivityurl]
[![Bundle Size][bundlesizebadge]][bundlesizeurl]
[![Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite#get-started)
[![License: MIT][licensebadge]][licenseurl]

[![Tests][testsbadge]][testsurl]
[![Lint][lintbadge]][linturl]
[![Typecheck][typecheckbadge]][typecheckurl]
[![Shellcheck][shellcheckbadge]][shellcheckurl]
[![Markdown][markdownlintbadge]][markdownlinturl]

<br />

**[🌐 Official Site](https://create-awesome-node-app.vercel.app)** · [Templates](https://create-awesome-node-app.vercel.app/templates) · [Extensions](https://create-awesome-node-app.vercel.app/extensions) · [Docs](https://create-awesome-node-app.vercel.app/docs) · [GitHub](https://github.com/Create-Node-App/create-node-app)

</div>

---

## ⚡ Get started in 30 seconds

```bash
npm create awesome-node-app@latest my-app
```

That's it. The interactive wizard walks you through picking a template, addons, and package manager — you're done before your coffee gets cold.

> **Want to go fully non-interactive?** Specify everything up front:
>
> ```bash
> npx create-awesome-node-app my-app \
>   --template react-vite-boilerplate \
>   --addons material-ui github-setup \
>   --no-interactive
> ```

---

## ✨ Why Create Awesome Node App?

Most scaffolding tools lock you into a single opinionated stack. **CNA is different** — it's a _composable_ scaffolding engine built around the idea that your stack should be yours.

|                               | CNA | Traditional scaffolders |
| ----------------------------- | --- | ----------------------- |
| Mix templates + addons        | ✅  | ❌                      |
| Bring your own template URL   | ✅  | ❌                      |
| Interactive _and_ CI-friendly | ✅  | Partial                 |
| AGENTS.md for AI assistants   | ✅  | ❌                      |
| Extension ecosystem           | ✅  | ❌                      |
| Node 22 native                | ✅  | Varies                  |

**One CLI. Any stack.**

---

## 🚀 What you get out of the box

Every project bootstrapped with CNA includes:

- 🧱 **Production-ready structure** — no empty folders or placeholder files
- 🔷 **TypeScript** — strict mode, ready to go
- 🧹 **ESLint + Prettier** — framework-specific rules pre-configured
- 🧪 **Testing setup** — vitest, jest, playwright, or cypress (depends on template)
- 🤖 **`AGENTS.md`** — a contract file so your AI coding assistant understands your project conventions
- 🔄 **GitHub Actions workflows** — CI, linting, and releases via addons
- 📦 **Your choice of package manager** — npm, yarn, or pnpm

---

## 🌐 Explore the Catalog

Visit **[create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)** to visually browse the full ecosystem:

- 🗂 Templates organized by category (Frontend, Backend, Full Stack, Monorepo, Web Extension, UAT)
- 🧩 Extensions filterable by compatibility
- 📖 Guides on how the generation pipeline works

Or discover everything from your terminal:

```bash
# List all available templates
create-awesome-node-app --list-templates

# List addons compatible with a specific template
create-awesome-node-app --template react-vite-boilerplate --list-addons
```

---

## 🧱 Template Ecosystem

| Category         | Example Templates                                                 |
| ---------------- | ----------------------------------------------------------------- |
| 🖥 Frontend      | `react-vite-boilerplate` — React 18 + Vite + TS + ESLint + Vitest |
| 🔧 Backend       | `nestjs-boilerplate` — NestJS + TS + ESLint + Jest                |
| 🌐 Full Stack    | `nextjs-starter` — Next.js + SSR + TS + Prettier                  |
| 🗂 Monorepo      | `turborepo-boilerplate` — Turborepo + Changesets + TS             |
| 🧩 Web Extension | `web-extension-react-boilerplate` — Cross-browser + React         |
| 🧪 UAT / Testing | `webdriverio-boilerplate` — E2E automation scaffold               |

→ Full catalog at **[create-awesome-node-app.vercel.app/templates](https://create-awesome-node-app.vercel.app/templates)**

---

## 🧩 Addons / Extensions

Think of addons as _lego bricks_ — snap them onto any template to add exactly what you need:

| Category        | Examples                                                 |
| --------------- | -------------------------------------------------------- |
| 🎨 UI Libraries | Material UI, Tailwind CSS, component libraries           |
| 📊 State & Data | Jotai, tRPC, React Query, Zustand                        |
| 🔧 Tooling      | GitHub Actions workflows, changesets, release automation |
| ✅ Code Quality | ESLint configs, Prettier, TypeScript strictness          |
| 🧪 Testing      | Playwright, Cypress, Vitest setups                       |
| 🛠 DX           | Commit linting, conventional commits, environment setup  |

Add any extension by slug or URL:

```bash
npx create-awesome-node-app my-app \
  --template react-vite-boilerplate \
  --addons material-ui github-setup commitlint \
  --extend https://github.com/your-org/your-custom-extension
```

---

## 🤖 AI-Ready with `AGENTS.md`

CNA generates an **`AGENTS.md`** file in supported templates — a structured document that tells AI coding assistants (GitHub Copilot, Cursor, Claude, etc.) about:

- Project purpose and conventions
- Directory layout and naming rules
- Scripts and how to use them
- Testing strategy and linting rules

This dramatically improves AI suggestion quality and speeds up onboarding for hybrid human+AI teams.

→ Learn more at **[create-awesome-node-app.vercel.app/docs/agents-md](https://create-awesome-node-app.vercel.app/docs/agents-md)**

---

## 🧪 Interactive Mode Walkthrough

When you run CNA without flags (or with `--interactive`), the wizard guides you through:

1. **Project name** — set or confirm your app's name
2. **Package manager** — npm, yarn, or pnpm
3. **Category** — Frontend, Backend, Full Stack, Monorepo, Web Extension, UAT, or Custom
4. **Template** — pick from curated options with descriptions and keywords
5. **Extensions** — multi-select compatible addons grouped by purpose
6. **Custom extensions** — optionally extend with any additional URLs

The CLI composes a `templatesOrExtensions` pipeline and generates your workspace in one shot.

---

## ⚙️ Requirements

- **Node.js >= 22** (enforced at startup — no silent failures)
- npm >= 7, yarn, or pnpm

We recommend [`fnm`](https://github.com/Schniz/fnm) for fast Node version switching:

```bash
fnm use 22
npm create awesome-node-app@latest my-app
```

---

## 🔍 CLI Reference

```
Usage: create-awesome-node-app [project-directory] [options]
```

| Flag                         | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `--interactive`              | Force interactive wizard (default outside CI)      |
| `--no-interactive`           | Disable wizard — use flags only                    |
| `-t, --template <slug\|url>` | Template slug from catalog or remote GitHub URL    |
| `--addons [slugs...]`        | Space-separated addon slugs or URLs                |
| `--extend [urls...]`         | Extra extension URLs to layer on top               |
| `--no-install`               | Generate files without installing dependencies     |
| `--use-yarn`                 | Use yarn instead of npm                            |
| `--use-pnpm`                 | Use pnpm instead of npm                            |
| `--list-templates`           | Print all templates grouped by category            |
| `--list-addons`              | Print addons (optionally filtered by `--template`) |
| `-v, --verbose`              | Output resolved generation config as JSON          |
| `-i, --info`                 | Print Node, npm, OS environment diagnostics        |
| `-V, --version`              | Print CLI version                                  |
| `-h, --help`                 | Show help                                          |

---

## 🛠 Programmatic Usage

Need to integrate CNA into your own tooling? The core is importable:

```ts
import { createNodeApp, getTemplateDirPath } from "@create-node-app/core";
```

> Note: The programmatic API is experimental and subject to change. Prefer the CLI for stable usage.

---

## ❓ FAQ

<details>
<summary><strong>Why another scaffolder?</strong></summary>

Because most CLIs lock you into one stack. CNA lets you _compose_ your stack: pick a curated template, add modular extensions, and bring your own blueprints via URL. No vendor lock-in.

</details>

<details>
<summary><strong>Can I use my own template?</strong></summary>

Yes. Pass a GitHub URL (with optional subdirectory path) via `--template`:

```bash
npx create-awesome-node-app my-app \
  --template https://github.com/your-org/your-repo/tree/main/template
```

</details>

<details>
<summary><strong>Are addons order-sensitive?</strong></summary>

They're applied sequentially in the order you specify. If two addons touch the same file, later ones win — just like a git merge.

</details>

<details>
<summary><strong>Does it support monorepos?</strong></summary>

Yes. Use the `turborepo-boilerplate` template for a multi-package workspace with Turborepo, Changesets, and shared TypeScript/ESLint configs ready to go.

</details>

<details>
<summary><strong>What about CI environments?</strong></summary>

CNA auto-detects CI and disables interactive mode. All options can be passed via flags for fully scripted generation — perfect for bootstrapping in automation pipelines.

</details>

<details>
<summary><strong>Is Node 22 really required?</strong></summary>

Yes — we target the latest LTS runtime for native ESM support, performance, and modern language features. Use `fnm` or `nvm` to switch quickly if needed.

</details>

---

## 🗺 Roadmap

- Remix and SvelteKit template variants
- Additional testing packs (contract, performance, load testing)
- Template version pinning and diff-based upgrade paths
- Rich template analytics and usage metrics

→ Track progress in [Issues](https://github.com/Create-Node-App/create-node-app/issues) and [Discussions](https://github.com/Create-Node-App/create-node-app/discussions).

---

## 🤝 Contributing

Contributions are what make CNA better — templates, addons, bug fixes, docs, ideas. All welcome!

- **Main repo:** [github.com/Create-Node-App/create-node-app](https://github.com/Create-Node-App/create-node-app)
- **Template & extension data:** [github.com/Create-Node-App/cna-templates](https://github.com/Create-Node-App/cna-templates)
- **Contributing guide:** [CONTRIBUTING.md](https://github.com/Create-Node-App/create-node-app/blob/main/CONTRIBUTING.md)

---

## 📜 License

MIT © [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

---

<div align="center">

**[🌐 create-awesome-node-app.vercel.app](https://create-awesome-node-app.vercel.app)**

_Built with ♥ for developers who value speed, clarity, and composability._

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
