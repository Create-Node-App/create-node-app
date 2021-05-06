# Create Node App

[![Build Status](https://github.com/Create-Node-App/create-node-app/workflows/Build/badge.svg)](https://github.com/Create-Node-App/create-node-app/commits/main)
[![npm](https://img.shields.io/npm/v/cna-cli.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/cna-cli)
[![npm](https://img.shields.io/npm/dm/cna-cli.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/cna-cli)

This starter kit is designed to get you up and running with a bunch of awesome front-end technologies.

The primary goal of this project is to provide a stable foundation upon which to build modern web appliications. Its purpose is not to dictate your project structure or to demonstrate a complete real-world application, but to provide a set of tools intended to make front-end development robust and easy.

- [Creating an app](#creating-an-app) - Create a _Node_ app.

## Quickstart

```sh
$ npx cna-cli my-app
$ cd my-app
$ npm start
```

the generated project will vary in the presence of the following flags:

| Flag         | What is it for?                                        |
| ------------ | ------------------------------------------------------ |
| `--verbose`  | print additional logs.                                 |
| `--info`     | print environment debug info.                          |
| `--nodeps`   | will no install dependencies on the generated project. |
| `--use-npm`  | will use npm as command.                               |
| `--inplace`  | apply setup to an existing project.                    |
| `-a <alias>` | will setup webpack alias. `app` by default.            |

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

## Creating an app

**You’ll need to have Node 8.10.0 or later on your local development machine** (but it’s not required on the server). You can use [fnm](https://github.com/Schniz/fnm) to easily switch Node versions between different projects.

To create a new app, you may choose one of the following methods:

### npx

```sh
$ npx cna-cli my-app
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

It will create a directory called `my-app` inside the current folder.
