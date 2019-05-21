# React Redux + Webpack Starter

[![Build Status](https://travis-ci.com/ulises-jeremias/react-redux-webpack-starter.svg?branch=develop)](https://travis-ci.com/ulises-jeremias/react-redux-webpack-starter)

This starter kit is designed to get you up and running with a bunch of awesome front-end technologies.

The primary goal of this project is to provide a stable foundation upon which to build modern web appliications. Its purpose is not to dictate your project structure or to demonstrate a complete real-world application, but to provide a set of tools intended to make front-end development robust and easy.

-  [Creating an app](#creating-an-app) - Create a _React Redux + Webpack_ app.
-  [Generated App](#generated-app) - Understanding apps bootstraped _React Redux + Webpack Starter_.

## Quickstart

```sh
$ npx create-react-redux-webpack-project my-app
$ cd my-app
$ npm start
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

Then open [http://localhost:8091/](http://localhost:8091/) to see your app.<br>

## Creating an app

**You’ll need to have Node 8.10.0 or later on your local development machine** (but it’s not required on the server). You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to easily switch Node versions between different projects.

To create a new app, you may choose one of the following methods:

### npx

```sh
$ npx create-react-redux-webpack-project my-app
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

### npm

```sh
$ npm init react-redux-webpack-project my-app
```

_`npm init <initializer>` is available in npm 6+_

### yarn

```sh
$ yarn create react-redux-webpack-project my-app
```

_`yarn create` is available in Yarn 0.25+_

It will create a directory called `my-app` inside the current folder.<br>
Inside that directory, it will generate the initial project structure and install the transitive dependencies. See [Project Structure](#project-structure).

## Generated App

Understanding apps bootstrapped with _React Redux + Webpack Starter_.

The template consists of:

-   a typical project layout structure
-   a Babel setup and configuration
-   a Webpack setup and configuration
-   an ESLint setup and configuration
-   a LESS and Semantic UI setup and configuration
-   a sample React component to display list codes
-   a Redux setup to handle state
-   a React Router setup to show basic navigation

Additionaly, the template provides a development and production webpack configuration.

* * *

## Developed With

-   [Node.js](https://nodejs.org/en/) - Javascript runtime
-   [React](https://reactjs.org/) - A javascript library for building user interfaces
-   [React Router](https://reacttraining.com/react-router/) - Declarative routing for React
-   [Redux](https://redux.js.org) - Redux is a predictable state container for JavaScript apps.
-   [Redux-Promise-Middleware](https://github.com/pburtchaell/redux-promise-middleware) - Redux middleware for promises, async functions and conditional optimistic updates
-   [Redux-Thunk](https://github.com/reduxjs/redux-thunk) - Thunk middleware for Redux
-   [Babel](https://babeljs.io/) - A transpiler for javascript
-   [Webpack](https://webpack.js.org/) - A module bundler
-   [LESS](http://lesscss.org/) - A css metalanguage

* * *

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Requirements

The following software is required to be installed on your system:

-   Node v10.x
-   Yarn v1.7.0 or later

Type the following commands in the terminal to verify your node and yarn versions

```sh
$ node -v
$ yarn -v
```

### Install

After confirming that your environment meets the above [requirements](#requirements), you can create a new project based on `react-redux-webpack-starter` by doing the following:

**Clone the repository from GitHub**

```sh
$ git clone https://github.com/ulises-jeremias/react-redux-webpack-starter.git <my-project-name>
```

_OR USING SSH_

```sh
$ git clone git@github.com:ulises-jeremias/react-redux-webpack-starter.git <my-project-name>
```

**Install node modules**

When that's done, install the project dependencies. It is recommended that you use [Yarn](https://yarnpkg.com/) for deterministic dependency management, but `npm install` will suffice.

```sh
$ cd <my-project-name>
$ yarn
```

### Running the Project

After completing the [installation](#installation) step, you're ready to start the project!

```bash
$ yarn start  # Start the development server (or `npm start`)
```

While developing, you will probably rely mostly on `yarn start`; however, there are additional scripts at your disposal:

|`yarn <script>`                |Description|
|-------------------------------|-----------|
|`start`                        |Serves your app at `localhost:8091`|
|`build:dev`                    |Builds the application to ./dist (_the build output dir could be configured in `./config/common-paths.js`_) |
|`build:dev:watch`              |Builds the application and watch for changes|
|`build:dev:bundleanalyze`      |Builds the application with Bundle Analyzer Plugin instaled|
|`build:dev:bundlebuddy`        |Builds the application with Bundle Buddy Plugin instaled|
|`build:dev:dashboard`          |Builds the application with Dashboard|
|`test`                         |Runs unit tests with Jest. See [testing](#testing)|
|`test:watch`                   |Runs `test` in watch mode to re-run tests when changed|
|`lint`                         |[Lints](http://stackoverflow.com/questions/8503559/what-is-linting) the project for potential errors|
|`lint:fix`                     |Lints the project and [fixes all correctable errors](http://eslint.org/docs/user-guide/command-line-interface.html#fix)|

## Project Structure

```
.
├── config                   # Webpack configuration
├── public                   # Static public assets (not imported anywhere in source code)
│   └── index.html           # Main HTML page container for app
├── src                      # Application source code
|   ├── actions              # Redux actions
│   ├── components           # Global Reusable Components
│   ├── containers           # Global Reusable Container Components and pplication Layout in which to render routes
|   ├── reducers             # Reducer registry and injection
│   ├── routes               # Main route definitions and async split points
│   │   └── app.js           # Bootstrap main application routes
|   ├── state                # Store initial state
│   ├── store.js             # Redux-specific pieces
│   ├── styles               # Application-wide styles
|   |   ├── custom           # Custom application styles
|   |   └── semantic-ui      # Semantic-UI theme files
|   ├── i18n.js              # i18n configuration
|   ├── index.js             # Application bootstrap and rendering with store
|   └── store.js             # Create and instrument redux store
├── static                   # Static public assets imported anywhere in source code
└── test                     # Unit tests
```

## Live Delopment

### Hot Reloading

Hot reloading is enabled by default when the application is running in development mode (`yarn start`). This feature is implemented with webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) capabilities, where code updates can be injected to the application while it's running, no full reload required. Here's how it works:

For **JavaScript** modules, a code change will trigger the application to re-render from the top of the tree. **Global state is preserved (i.e. redux), but any local component state is reset**. This differs from React Hot Loader, but we've found that performing a full re-render helps avoid subtle bugs caused by RHL patching.

## Testing

To add a unit test, create a `.test.js` file anywhere inside of `./test`. Jest and webpack will automatically find these files.

## Deployment

Out of the box, this starter kit is deployable by serving the `./dist` folder generated by `yarn build:prod`. This project does not concern itself with the details of server-side rendering or API structure, since that demands a more opinionated structure that makes it difficult to extend the starter kit. The simplest deployment strategy is a static deployment.

_the build output dir could be configured in `./config/common-paths.js`_