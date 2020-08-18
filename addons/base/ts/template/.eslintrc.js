const path = require('path');

module.exports = {
  "parser": "@typescript-eslint/parser",
  "extends": [
    "plugin:react/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": 2018,
    "ecmaFeatures": {
      "jsx": true
    },
    "sourceType": "module"
  },
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true,
    "jest/globals": true,
  },
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": path.join(__dirname, 'config', 'webpack.common.js')
      }
    }
  },
  "plugins": [
    "react",
    "jsx-a11y",
    "import",
    "jest",
  ],
  "overrides": [{
    "files": ["**/*.tsx"],
    "rules": {
        "react/prop-types": "off"
    }
  }]
}
