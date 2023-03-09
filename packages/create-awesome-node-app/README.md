<!--lint disable double-link awesome-heading awesome-git-repo-age awesome-toc-->

<div align="center">
<h1>Create Awesome Node App</h1>

[Changelog](#) |
[Contributing](./CONTRIBUTING.md)

</div>
<div align="center">

[![Continious Integration][cibadge]][ciurl]
[![npm][npmversion]][npmurl]
[![npm][npmdownloads]][npmurl]
[![License: MIT][licensebadge]][licenseurl]

</div>

The primary goal of this project is to provide a stable foundation upon which to build modern web applications. Its purpose is not to dictate your project structure or to demonstrate a complete real-world application, but to provide a set of tools intended to make front-end development robust and easy.

## Quickstart

```sh
npx create-awesome-node-app my-project # or specify flag `-h` to see all options
cd my-project
npm start
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

## Creating an app

**You’ll need to have Node 18 or later on your local development machine**. You can use [fnm](https://github.com/Schniz/fnm) to easily switch Node versions between different projects.

It will create a directory called `my-project` inside the current folder.<br>
Inside that directory, it will generate the initial project structure and install the transitive dependencies.

To create a new app, you may choose one of the following methods:

### npx

```sh
npx create-awesome-node-app my-project
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

### npm

```sh
npm init awesome-node-app my-project
```

_`npm init <initializer>` is available in npm 6+_

### yarn

```sh
yarn create awesome-node-app my-project
```

_`yarn create` is available in Yarn 0.25+_

## Contributors

<a href="https://github.com/Create-Node-App/create-node-app/contributors">
  <img src="https://contrib.rocks/image?repo=Create-Node-App/create-node-app"/>
</a>

Made with [contributors-img](https://contrib.rocks).

[cibadge]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml/badge.svg
[npmversion]: https://img.shields.io/npm/v/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[npmdownloads]: https://img.shields.io/npm/dm/create-awesome-node-app.svg?maxAge=2592000?style=plastic
[licensebadge]: https://img.shields.io/badge/License-MIT-blue.svg
[ciurl]: https://github.com/Create-Node-App/create-node-app/actions/workflows/ci.yml
[npmurl]: https://www.npmjs.com/package/create-awesome-node-app
[licenseurl]: https://github.com/Create-Node-App/create-node-app/blob/main/LICENSE
