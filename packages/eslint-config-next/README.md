<div align="center">

<h1>📐 <code>@create-node-app/eslint-config-next</code></h1>

<p><strong>Next.js ESLint configuration for Create Awesome Node App projects.</strong><br/>
Extends the TypeScript config with the official Next.js ESLint plugin.</p>

[![npm][npmversion]][npmurl]
[![Downloads][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

---

## Installation

```bash
npm install --save-dev @create-node-app/eslint-config-next
```

Requires **ESLint ^9** and **TypeScript ^5**.

---

## Usage

In your `eslint.config.*` or `.eslintrc.*`:

```json
{
  "extends": ["@create-node-app/eslint-config-next"]
}
```

---

## What's Included

This config extends `@create-node-app/eslint-config-ts` and the official `eslint-config-next`, then applies two rule overrides:

| Rule                                | Value | Reason                                        |
| ----------------------------------- | ----- | --------------------------------------------- |
| `@next/next/no-html-link-for-pages` | `off` | Pages directory not always used (App Router)  |
| `react/jsx-key`                     | `off` | Already covered by TypeScript's strict checks |

---

## Inheritance Chain

```text
@create-node-app/eslint-config (base)
  └── @create-node-app/eslint-config-ts
       └── @create-node-app/eslint-config-next
```

---

## License

MIT &copy; [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)

<!-- Reference links -->

[npmversion]: https://img.shields.io/npm/v/@create-node-app/eslint-config-next.svg?style=flat-square&color=cb3837
[npmdownloads]: https://img.shields.io/npm/dm/@create-node-app/eslint-config-next.svg?style=flat-square&color=cb3837
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[npmurl]: https://www.npmjs.com/package/@create-node-app/eslint-config-next
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
