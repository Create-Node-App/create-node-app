const dependencies = require('./dependencies')
const devDependencies = require('./devDependencies')

module.exports = function resolvePackage(setup, { appName, command }) {
  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
    browserslist: {
      production: [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      development: [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    },
    scripts: {
      "build": "webpack --config webpack.config.js",
      "build:dev": `${command} build --env.env=development`,
      "build:dev:watch": `${command} build:dev --watch --hot`,
      "build:dev:analyze": `${command} build:dev --env.addon=bundleanalyze --env.addon=bundlevisualizer`,
      "build:prod": `${command} build -p --env.env=production`,
      "build:prod:watch": `${command} build:prod --watch`,
      "build:prod:analyze": `${command} build:prod --env.addon=bundleanalyze --env.addon=bundlevisualizer`,
      "lint": "prettier --ignore-path .eslintignore --check \"**/*.{js,jsx,json,css,sass,scss,less,html,md}\"",
      "lint:fix": "prettier --ignore-path .eslintignore --write \"**/*.{js,jsx,json,css,sass,scss,less,html,md}\"",
      "serve:dev": "webpack-dev-server --mode development --open --hot --env.env=development",
      "serve:dev:dashboard": "webpack-dashboard webpack-dev-server -- --mode development --env.addon=dashboard",
      "start": `${command} serve:dev`,
      "test": "jest --runInBand --detectOpenHandles --passWithNoTests",
      "test:watch": "jest -u --runInBand --verbose --watch --detectOpenHandles --passWithNoTests",
      "test:coverage": "jest -u --coverage --verbose --runInBand --detectOpenHandles --passWithNoTests",
    },
    husky: {
      "hooks": {
        "pre-commit": "lint-staged"
      }
    },
    "lint-staged": {
      "*.{js,jsx}": [
        "prettier --write",
        "yarn lint:fix",
        "git add"
      ],
      "*.{json,css,sass,scss,less,html,md}": [
        "prettier --write",
        "git add"
      ]
    }
  }

  return { packageJson, dependencies, devDependencies }
}
