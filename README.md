# JSPlayground

The template consists of:

-   a typical project layout structure
-   a Babel setup and configuration
-   a Webpack setup and configuration
-   an ESLint setup and configuration
-   a SCSS setup and configuration
-   a sample React component to display list codes
-   a Redux setup to handle state
-   a React Router setup to show basic navigation

Additionaly, the template provides a development and production webpack configuration.

* * *

## Developed With

-   [Node.js](https://nodejs.org/en/) - Javascript runtime
-   [React](https://reactjs.org/) - A javascript library for building user interfaces
-   [React Router] - Declarative routing for React
-   [Redux] - Redux is a predictable state container for JavaScript apps.
-   [Redux-Promise-Middleware] - Redux middleware for promises, async functions and conditional optimistic updates
-   [Redux-Thunk] - Thunk middleware for Redux
-   [Babel](https://babeljs.io/) - A transpiler for javascript
-   [Webpack](https://webpack.js.org/) - A module bundler
-   [SCSS](http://sass-lang.com/) - A css metalanguage

* * *

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

The following software is required to be installed on your system:

-   Node 8.x
-   Npm 3.x

Type the following commands in the terminal to verify your node and yarn versions

```bash
$ node -v
$ yarn -v
```

### Install

Follow the following steps to get development environment running.

-   Clone _'playground.js'_ repository from GitHub

    ```bash
    git clone https://github.com/ulises-jeremias/playground.js.git
    ```

     _OR USING SSH_

    ```bash
    git clone git@github.com:ulises-jeremias/playground.js.git
    ```

-   Install node modules

    ```bash
    $ cd playground.js
    $ yarn
    ```

### Build

#### Build Application

|       dev      |       prod      |
| :------------: | :-------------: |
| yarn build:dev | yarn build:prod |

#### Build Application And Watch For Changes

|          dev         |          prod         |
| :------------------: | :-------------------: |
| yarn build:dev:watch | yarn build:prod:watch |

#### Build Application With BundleAnalayzer Plugin Included

|              dev             |              prod             |
| :--------------------------: | :---------------------------: |
| yarn build:dev:bundleanalyze | yarn build:prod:bundleanalyze |

After running the above command, a browser window will open displaying an interactive graph resembling the following image:

#### Build Application With BundleBuddy Plugin Included

|             dev            |             prod            |
| :------------------------: | :-------------------------: |
| yarn build:dev:bundlebuddy | yarn build:prod:bundlebuddy |

### Run ESlint

#### Lint Project Using ESLint

```bash
yarn lint
```

#### Lint Project Using ESLint, and autofix

```bash
yarn lint:fix
```

### Run

#### Run Start

This will run the _'serve:dev'_ yarn task

```bash
yarn start
```

#### Run Dev Server

```bash
yarn serve:dev
```

#### Run Dev Server With Dashboard

```bash
yarn serve:dev:dashboard
```

The above command will display a dashboard view in your console resembling the following image:

#### Run Prod Server

This command will build application using production settings and start the application using _live-server_

```bash
yarn serve:prod
```
