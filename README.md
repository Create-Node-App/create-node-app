<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">
<h1>🌟 Create Awesome Node App 🚀</h1>

[Changelog](./packages/create-awesome-node-app/CHANGELOG.md) |
[Contributing](./CONTRIBUTING.md)

</div>
<div align="center">

[![Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite#get-started)
[![Continious Integration][cibadge]][ciurl]
[![npm][npmversion]][npmurl]
[![npm][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

This repository contains the source code for the `create-awesome-node-app` package. ✨

![cna](https://user-images.githubusercontent.com/17727170/229553510-49d0d46f-11ac-4b07-acf3-8db8ce7959ec.gif)

## 🚀 Available Scripts

In the project directory, you can run:

| `npm run <script>` | Description                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `test`             | Runs unit tests with Jest.                                                                                              |
| `lint`             | 🚦 [Lints](http://stackoverflow.com/questions/8503559/what-is-linting) the project for potential errors                 |
| `lint:fix`         | Lints the project and [fixes all correctable errors](http://eslint.org/docs/user-guide/command-line-interface.html#fix) |
| `format`           | Formats the project using [Prettier](https://prettier.io/)                                                              |
| `type-check`       | Runs [TypeScript](https://www.typescriptlang.org/) type checking                                                        |

## Running Locally

When contributing you might want to test your changes locally before opening a PR. To do so, you can use the `create-awesome-node-app` CLI to create a new project and test your changes.

```sh
# Clone the repository
git clone https://github.com/Create-Node-App/create-node-app.git

# Move into the directory
cd create-node-app

# Setup your local environment
fnm use
npm install

# Build the CLI
npm run build -- --filter create-awesome-node-app

# Create a new project
./packages/create-awesome-node-app/index.js my-app
```

## 🤝 Contributing

- Contributions make the open source community such an amazing place to learn, inspire, and create.
- Any contributions you make are **truly appreciated**.
- Check out our [contribution guidelines](./CONTRIBUTING.md) for more information.

[cibadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg
[ciurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
