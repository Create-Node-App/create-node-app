<div align="center">

<h1>⚙️ <code>@create-node-app/core</code></h1>

<p><strong>Programmatic engine behind Create Awesome Node App.</strong><br/>
Import the scaffolding pipeline — composable, headless, and CI-ready.</p>

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]
[![Discord](https://img.shields.io/discord/1527933660764831825?label=Discord&logo=discord&logoColor=white)](https://discord.gg/bR5VyATgka)

</div>

---

## Installation

```bash
npm install @create-node-app/core
```

Requires **Node.js >= 22**.

> This is the _engine_ package. For the interactive CLI, use [`create-awesome-node-app`](https://www.npmjs.com/package/create-awesome-node-app) instead.

---

## Usage

### Scaffold a project programmatically

```ts
import { createNodeApp, getTemplateDirPath } from "@create-node-app/core";

await createNodeApp(
  "my-app",
  {
    projectName: "my-app",
    template: "react-vite-boilerplate",
  },
  (options) => Promise.resolve(options),
);
```

### Check environment info

```ts
import { printEnvInfo } from "@create-node-app/core";

await printEnvInfo();
// Prints OS, CPU, Node, npm, browsers, etc. Then exits.
```

### Validate the Node.js version

```ts
import { checkNodeVersion } from "@create-node-app/core";

checkNodeVersion(">=22", "my-tool");
// Exits with a red error message if the version doesn't match.
```

---

## API Reference

All exports from `@create-node-app/core`:

### Functions

| Signature                                                    | Description                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createNodeApp(programName, options, transformOptions)`      | Main scaffolding orchestrator. Resolves the template, copies files, merges configs, installs deps, and initializes git.                     |
| `checkNodeVersion(requiredVersion, packageName)`             | Compares `process.version` against a semver range. Exits with code 1 if too old.                                                            |
| `checkForLatestVersion(packageName)`                         | Fetches the latest version from the npm registry. Falls back to `npm view`. Returns `null` if both fail.                                    |
| `printEnvInfo()`                                             | Prints OS, CPU, binaries, and browser info to stdout, then exits.                                                                           |
| `getPackagePath(templateOrExtension, name?, ignorePackage?)` | Resolves a file path inside a template/extension directory (usually `package.json`). Handles GitHub URLs, `file://` URLs, and legacy slugs. |
| `getTemplateDirPath(templateOrExtensionUrl)`                 | Resolves the template directory. Looks for a `template/` subdirectory first, falls back to the resolved root.                               |
| `getTemplateBaseDirPath(templateOrExtensionUrl)`             | Returns the parent of the `template/` directory (where `cna.config.json` lives).                                                            |
| `downloadRepository(options)`                                | Clones or pulls a Git repo into a cache dir, then copies files to the target. Supports offline mode, deduplication, and error formatting.   |
| `loadTemplateCnaConfig(templateUrl)`                         | Loads the optional `cna.config.json` from a template's base directory.                                                                      |

### Types

| Type                  | Shape                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `CnaOptions`          | `{ projectName, info?, verbose?, packageManager?, install?, template?, templatesOrExtensions?, ... }` |
| `CnaOptionsTransform` | `(options: CnaOptions) => Promise<CnaOptions>`                                                        |
| `CnaConfig`           | `{ customOptions?: CnaCustomOption[] }`                                                               |
| `CnaCustomOption`     | `{ name, type, message?, initial?, ... }`                                                             |
| `TemplateOrExtension` | `{ url: string; ignorePackage?: boolean }`                                                            |

---

## How It Works

```text
createNodeApp()
  ├── checkNodeVersion()
  ├── printEnvInfo() if info flag
  ├── resolve templates/extensions via getTemplateDirPath()
  ├── download Git repos via downloadRepository()
  ├── load cna.config.json via loadTemplateCnaConfig()
  ├── merge package.json files via lodash.merge
  ├── copy/process template files (Lodash interpolation, .if-npm, .append, etc.)
  ├── install dependencies (npm/yarn/pnpm/bun)
  ├── git init
  └── format + lint:fix post-install
```

---

## Platform Notes

### Windows compatibility

The core engine supports Windows, but some behaviors differ from Linux/macOS:

- **Executable resolution** — On Windows, `execFileSync` uses `CreateProcess` internally, which consults `PATHEXT` (`.com;.exe;.bat;.cmd;...`). The bare command name (e.g., `npm`, `bun`) is passed without extension; Node.js resolves the correct binary via PATH + PATHEXT.
- **File permissions** — `fs.chmod` for the executable bit (`0o111`) is silently ignored on Windows, where POSIX permission semantics don't apply. Template files retain their original mode as a best-effort operation.
- **Long paths** — Scaffolding a project with a path longer than ~200 characters on Windows automatically uses the `\\?\` prefix to bypass the MAX_PATH (260 char) limit.
- **File URLs** — The engine normalizes `file:///C:/path`, `file:///C:path` (drive-relative), and `file:////server/share` (UNC) to native Windows paths.
- **Case-insensitive skip list** — The internal file-filter skips `package.json`, `package-lock.json`, etc. using case-insensitive matching to account for the Windows filesystem.
- **Recommended shell** — Use **Git Bash** or **WSL** when working with templates that rely on POSIX permission bits (e.g., husky hooks, shell scripts). Running via `cmd.exe` or PowerShell works for basic scaffolding but may not preserve executable bits.

## Architecture

The package is organized into these modules:

| Module         | Responsibility                                                                                |
| -------------- | --------------------------------------------------------------------------------------------- |
| `index.ts`     | Barrel export and main `createNodeApp` orchestration                                          |
| `installer.ts` | Project directory creation, dep installation, git init, post-install scripts                  |
| `loaders.ts`   | File discovery, classification (`.template`, `.append`, conditional prefixes), and processing |
| `package.ts`   | Deep-merges `package.json` from multiple templates/extensions                                 |
| `paths.ts`     | URL resolution — GitHub branches, `file://`, legacy slugs, cache at `~/.cna/`                 |
| `git.ts`       | Clone/pull with deduplication, offline support, error formatting                              |
| `config.ts`    | Reads optional `cna.config.json` for custom CLI prompts                                       |
| `helpers.ts`   | Package manager detection, online check, path/naming utilities                                |

---

## Related

- [`create-awesome-node-app`](https://www.npmjs.com/package/create-awesome-node-app) — Interactive CLI built on this core
- [Create Node App](https://github.com/Create-Node-App/create-node-app) — Monorepo
- [Templates catalog](https://github.com/Create-Node-App/cna-templates)

---

## License

MIT &copy; [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

<!-- Reference links -->

[npmversion]: https://img.shields.io/npm/v/@create-node-app/core.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/@create-node-app/core.svg?style=flat-square&color=cb3837
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[npmurl]: https://www.npmjs.com/package/@create-node-app/core
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
