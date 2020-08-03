# React + Webpack Starter

[![Build Status](https://github.com/ulises-jeremias/react-webpack-starter/workflows/Build/badge.svg)](https://github.com/ulises-jeremias/react-webpack-starter/commits/develop)

This starter kit is designed to get you up and running with a bunch of awesome front-end technologies.

The primary goal of this project is to provide a stable foundation upon which to build modern web appliications. Its purpose is not to dictate your project structure or to demonstrate a complete real-world application, but to provide a set of tools intended to make front-end development robust and easy.

-  [Creating an app](#creating-an-app) - Create a _React + Webpack_ app.
-  [Generated App](#generated-app) - Understanding apps bootstraped _React + Webpack Starter_.

## Quickstart

```sh
$ npx create-react-webpack-project my-app
$ cd my-app
$ npm start
```

the generated project will vary in the presence of the following flags:

| Flag | What is it for? | 
|------|-----------------|
| `--verbose` | print additional logs. |
| `--info` | print environment debug info. |
| `--no-deps` | will no install dependencies on the generated project. |
| `--use-npm` | will use npm as command. |
| `--inplace` | apply setup to an existing project. |
| `-a <alias>` | will setup webpack alias. `app` by default. |
| `--typescript` | add TypeScript support. |
| `--redux` | add redux support and setup using redux thunk middleware by default. |
| `--redux --saga` | add redux support and setup using redux saga middleware. |
| `--recoil` | add recoil.js support and setup the state management library for React. |
| `--antd` | add ant-design setup with ant-design icons package. |
| `--bootstrap` | add bootstrap and bootstrap-react setup with theme config. |
| `--material-ui` | add material ui setup with SVG icons. |
| `--semantic-ui` | add semantic ui and semantic ui react setup with theme config. |
| `--docker` | generate dockerfiles for development and production environments. |
| `--android` | generates android setup using ionic react and capacitor.<br />if `--docker` flag is active, then will generate all dockerfiles to perform android emulation, testing and apk generation. |

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

Then open [http://localhost:8091/](http://localhost:8091/) to see your app.

## Creating an app

**You’ll need to have Node 8.10.0 or later on your local development machine** (but it’s not required on the server). You can use [fnm](https://github.com/Schniz/fnm) to easily switch Node versions between different projects.

To create a new app, you may choose one of the following methods:

### npx

```sh
$ npx create-react-webpack-project my-app
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

### npm

```sh
$ npm init react-webpack-project my-app
```

_`npm init <initializer>` is available in npm 6+_

### yarn

```sh
$ yarn create react-webpack-project my-app
```

_`yarn create` is available in Yarn 0.25+_

It will create a directory called `my-app` inside the current folder.<br>
Inside that directory, it will generate the initial project structure and install the transitive dependencies. See [Project Structure](#project-structure).

## Generated App

### Running the App

After completing the previous steps, you're ready to start the project!

```bash
$ yarn start  # Start the development server (or `npm start`)
```

While developing, you will probably rely mostly on `yarn start`; however, there are additional scripts at your disposal:

|`yarn <script>`                |Description|
|-------------------------------|-----------|
|`start`                        |Serves your app at `localhost:8091`|
|`build:dev`                    |Builds the application to ./build (_the build output dir could be configured in `./config/common-paths.js`_) |
|`build:dev:watch`              |Builds the application and watch for changes|
|`build:dev:analyze`            |Builds the application with Bundle Analyzer and Visualizer Plugins instaled|
|`build:dev:dashboard`          |Builds the application with Dashboard|
|`serve:dev:dashboard`          |Builds the application with Dashboard|
|`test`                         |Runs unit tests with Jest. See [testing](#testing)|
|`test:watch`                   |Runs `test` in watch mode to re-run tests when changed|
|`lint`                         |[Lints](http://stackoverflow.com/questions/8503559/what-is-linting) the project for potential errors|
|`lint:fix`                     |Lints the project and [fixes all correctable errors](http://eslint.org/docs/user-guide/command-line-interface.html#fix)|


## Project Structure

```
.
├── config                   # Webpack and Jest configuration
├── public                   # Static public assets (not imported anywhere in source code)
│   └── index.html           # Main HTML page template for app
├── src                      # Application source code
│   ├── components           # Global Reusable Components
│   ├── pages                # Components associated with routes
│   ├── routes               # Main route definitions and async split points
│   │   └── AppRoutes.jsx    # Bootstrap main application routes
│   ├── styles               # Application-wide styles
|   ├── ...
|   ├── i18n.js              # i18n configuration
|   ├── index.jsx            # Application bootstrap and rendering with store
└── static                   # Static public assets imported anywhere in source code
```

## Live Development

### Hot Reloading

Hot reloading is enabled by default when the application is running in development mode (`yarn start`). This feature is implemented with webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) capabilities, where code updates can be injected to the application while it's running, no full reload required. Here's how it works:

For **JavaScript** modules, a code change will trigger the application to re-render from the top of the tree. **Global state is preserved (i.e. redux), but any local component state is reset**. This differs from React Hot Loader, but we've found that performing a full re-render helps avoid subtle bugs caused by RHL patching.

## Testing

To add a unit test, create a `.test.js` file anywhere inside of `./test`. Jest and webpack will automatically find these files.

## Deployment

Out of the box, this starter kit is deployable by serving the `./build` folder generated by `yarn build:prod`. This project does not concern itself with the details of server-side rendering or API structure, since that demands a more opinionated structure that makes it difficult to extend the starter kit. The simplest deployment strategy is a static deployment.

_the build output dir could be configured in `./config/common-paths.js`_
