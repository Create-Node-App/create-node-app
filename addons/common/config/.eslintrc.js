const path = require('path');

module.exports = {
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true,
    "jest/globals": true,
  },
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": path.join(__dirname, 'config', 'webpack.common.js')
      }
    }
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "ecmaFeatures": {
      "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "jsx-a11y",
    "import",
    "jest",
  ],
  "rules": {
    "import/no-dynamic-require": "warn",
    "react/jsx-props-no-spreading": 0,
    "global-require": "warn",
    "no-param-reassign": "warn",
    "no-unused-vars": "warn",
    "no-underscore-dangle": 0,
    "no-use-before-define": 0,
  }
}
