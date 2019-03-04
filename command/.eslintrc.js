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
  "extends": ["airbnb", "eslint:recommended", "plugin:react/recommended"],
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": path.join(__dirname, 'config', 'webpack.common.config.js')
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
    "indent": ["error", 2, {
      "SwitchCase": 1
    }],
    "quotes": [
      "error",
      "single"
    ],
    "react/jsx-filename-extension": 0,
    "react/prefer-stateless-function": 0,
    "no-underscore-dangle": 0,
    "consistent-return": 0,
    "import/no-dynamic-require": 0,
    "react/prop-types": 0,
    "no-console": 0,
    "jsx-a11y/label-has-for": 0,
    "jsx-a11y/label-has-associated-control": 0,

    "array-callback-return": "error",
    "block-scoped-var": "error",
    "class-methods-use-this": "error",
    "default-case": "error",
    "dot-location": ["error", "property"],
    "dot-notation": "error",
    "no-alert": "error",
    "no-div-regex": "error",
    "no-else-return": "error",
    "no-eval": "error",
  }
}
