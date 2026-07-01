<div align="center">

<h1>📐 <code>@create-node-app/eslint-config-ts</code></h1>

<p><strong>TypeScript ESLint configuration for Create Awesome Node App projects.</strong><br/>
Extends the base config with <code>@typescript-eslint</code> for strict TypeScript linting.</p>

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

---

## Installation

```bash
npm install --save-dev @create-node-app/eslint-config-ts
```

Requires **ESLint ^9** and **TypeScript ^5**.

---

## Usage

In your `eslint.config.*` or `.eslintrc.*`:

```json
{
  "extends": ["@create-node-app/eslint-config-ts"]
}
```

---

## What's Included

This config extends `@create-node-app/eslint-config` and adds:

- **Parser**: `@typescript-eslint/parser`
- **Plugin rules**: `plugin:@typescript-eslint/recommended`
- **Custom rule**: `@typescript-eslint/ban-ts-comment` — requires a description of at least 10 characters when using `@ts-ignore`

---

## Inheritance Chain

```text
@create-node-app/eslint-config (base)
  └── @create-node-app/eslint-config-ts
```

Consumers can also extend from this config:

```text
@create-node-app/eslint-config-ts
  ├── @create-node-app/eslint-config-react
  └── @create-node-app/eslint-config-next
```

---

## License

MIT &copy; [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

<!-- Reference links -->

[npmversion]: https://img.shields.io/npm/v/@create-node-app/eslint-config-ts.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/@create-node-app/eslint-config-ts.svg?style=flat-square&color=cb3837
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[npmurl]: https://www.npmjs.com/package/@create-node-app/eslint-config-ts
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
