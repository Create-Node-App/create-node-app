<div align="center">

<h1>📐 <code>@create-node-app/eslint-config</code></h1>

<p><strong>Base ESLint configuration for Create Awesome Node App projects.</strong><br/>
Shared linting rules powered by Turborepo + Prettier.</p>

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

---

## Installation

```bash
npm install --save-dev @create-node-app/eslint-config
```

Requires **ESLint ^9**.

---

## Usage

In your `eslint.config.*` or `.eslintrc.*`:

```json
{
  "extends": ["@create-node-app"]
}
```

This config extends:

- **`turbo`** — Turborepo's recommended rules for monorepo workspaces
- **`prettier`** — Turns off rules that conflict with Prettier

And sets the default environment to `browser`, `commonjs`, `node`, and `es2020`.

---

## Related Configs

| Package                                | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `@create-node-app/eslint-config-ts`    | Adds TypeScript support (extends this config)          |
| `@create-node-app/eslint-config-react` | Adds React + React Hooks rules (extends the TS config) |
| `@create-node-app/eslint-config-next`  | Adds Next.js rules (extends the TS config)             |

---

## License

MIT &copy; [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

<!-- Reference links -->

[npmversion]: https://img.shields.io/npm/v/@create-node-app/eslint-config.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/@create-node-app/eslint-config.svg?style=flat-square&color=cb3837
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[npmurl]: https://www.npmjs.com/package/@create-node-app/eslint-config
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
