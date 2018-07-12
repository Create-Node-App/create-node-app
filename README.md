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

-   Node 9.10
-   Yarn 1.7

Type the following commands in the terminal to verify your node and yarn versions

```sh
$ node -v
$ yarn -v
```

### Install

Follow the following steps to get development environment running.

-   Clone the repository from GitHub

    ```sh
    $ git clone https://github.com/ulises-jeremias/playground.js.git
    ```

     _OR USING SSH_

    ```sh
    $ git clone git@github.com:ulises-jeremias/playground.js.git
    ```

-   Install node modules

    ```sh
    $ cd playground.js
    $ yarn
    ```

### Build

#### Build Application

|   development  |    production   |
| :------------: | :-------------: |
| yarn build:dev | yarn build:prod |

#### Build Application And Watch For Changes

|      development     |       production      |
| :------------------: | :-------------------: |
| yarn build:dev:watch | yarn build:prod:watch |

#### Build Application With BundleAnalayzer Plugin Included

|          development         |           production          |
| :--------------------------: | :---------------------------: |
| yarn build:dev:bundleanalyze | yarn build:prod:bundleanalyze |

After running the above command, a browser window will open displaying an interactive graph.

#### Build Application With BundleBuddy Plugin Included

|         development        |          production         |
| :------------------------: | :-------------------------: |
| yarn build:dev:bundlebuddy | yarn build:prod:bundlebuddy |

### Run ESlint

#### Lint Project Using ESLint

```sh
$ yarn lint
```

#### Lint Project Using ESLint, and autofix

```sh
$ yarn lint:fix
```

### Run

#### Run Start

This will run the _'serve:dev'_ yarn task

```sh
$ yarn start
```

#### Run Dev Server

```sh
$ yarn serve:dev
```

#### Run Dev Server With Dashboard

```sh
$ yarn serve:dev:dashboard
```

The above command will display a dashboard view in your console.

#### Run Prod Server

This command will build application using production settings and start the application using _live-server_

```sh
$ yarn serve:prod
```
