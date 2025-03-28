<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">
<h1>🌟 Create Awesome Node App 🚀</h1>

[![Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite#get-started)
[![Continious Integration][cibadge]][ciurl]
[![npm][npmversion]][npmurl]
[![npm][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

🔥 Powerful tool to scaffold your application choosing between different templates and extensions for Web apps, Web Extensions, Monorepos, and more! ✨

![cna](https://user-images.githubusercontent.com/17727170/229553510-49d0d46f-11ac-4b07-acf3-8db8ce7959ec.gif)

## ⚙️ Requirements

To use `create-awesome-node-app`, you need to have the following requirements:

- **Node.js 22**: We recommend using [`fnm`](https://github.com/Schniz/fnm) to manage your Node.js versions. Install `fnm` and set the Node.js version to the latest 22 version:

```sh
fnm use 22
```

## 📦 Installation

You can install `create-awesome-node-app` globally to use it as a CLI tool:

```sh
npm install -g create-awesome-node-app
```

Alternatively, you can use it without global installation by running it directly with `npx`, `yarn`, or `pnpm`.

## 🌟 Creating an App

### Using NPM, Yarn, or PNPM

- With NPM:

```sh
npm create awesome-node-app@latest --interactive
```

- With Yarn:

```sh
yarn create awesome-node-app --interactive
```

- With PNPM:

```sh
pnpm create awesome-node-app --interactive
```

### Using the CLI Directly

If you installed `create-awesome-node-app` globally, you can use it directly as a CLI tool:

```sh
create-awesome-node-app --template react-vite-boilerplate --addons jotai material-ui github-setup
```

This example uses the `react-vite-boilerplate` template and applies the `jotai`, `material-ui`, and `github-setup` extensions.

## 🔗 Full List of Templates and Extensions

You can find the full list of available templates and extensions in the [cna-templates repository](https://github.com/Create-Node-App/cna-templates).

## 📜 License

This project is licensed under the [MIT License][licenseurl].

[cibadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg
[ciurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
