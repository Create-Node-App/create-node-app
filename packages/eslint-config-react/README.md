<div align="center">

<h1>📐 <code>@create-node-app/eslint-config-react</code></h1>

<p><strong>React ESLint configuration for Create Awesome Node App projects.</strong><br/>
Extends the TypeScript config with React & React Hooks recommended rules.</p>

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

---

## Installation

```bash
npm install --save-dev @create-node-app/eslint-config-react
```

Requires **ESLint ^9** and **TypeScript ^5**.

---

## Usage

In your `eslint.config.*` or `.eslintrc.*`:

```json
{
  "extends": ["@create-node-app/eslint-config-react"]
}
```

---

## What's Included

This config extends `@create-node-app/eslint-config-ts` and layers on:

- **`plugin:react/recommended`** — React best practices
- **`plugin:react-hooks/recommended`** — Rules of Hooks enforcement

---

## Inheritance Chain

```text
@create-node-app/eslint-config (base)
  └── @create-node-app/eslint-config-ts
       └── @create-node-app/eslint-config-react
```

---

## License

MIT &copy; [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

<!-- Reference links -->

[npmversion]: https://img.shields.io/npm/v/@create-node-app/eslint-config-react.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/@create-node-app/eslint-config-react.svg?style=flat-square&color=cb3837
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[npmurl]: https://www.npmjs.com/package/@create-node-app/eslint-config-react
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
