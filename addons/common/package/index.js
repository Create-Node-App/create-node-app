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
      "lint": "eslint ./src --ext .jsx --ext .js",
      "lint:fix": "eslint ./src --fix --ext .jsx --ext .js --fix",
      "serve:dev": "webpack-dev-server --mode development --open --hot --env.env=development",
      "serve:dev:dashboard": "webpack-dashboard webpack-dev-server -- --mode development --env.addon=dashboard",
      "start": `${command} serve:dev`,
      "test": "jest --runInBand --detectOpenHandles --config .jest.config.js",
      "test:watch": "jest -u --runInBand --verbose --watch --detectOpenHandles --config .jest.config.js",
      "test:coverage": "jest -u --coverage --verbose --runInBand --detectOpenHandles --config .jest.config.js",
    }
  }

  return { packageJson, dependencies, devDependencies }
}
