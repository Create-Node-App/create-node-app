const path = require('path');

module.exports = {
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "extends": ["airbnb", "eslint:recommended", "plugin:react/recommended"],
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": path.resolve(__dirname, './config/webpack.common.config.js')
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
    "import"
  ],
  "rules": {
    "no-console": 0,
    "indent": ["error", 2, {
      "SwitchCase": 1
    }],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "react/jsx-filename-extension": 0,
    "react/prefer-stateless-function": 0,
    "no-underscore-dangle": 0,
    "consistent-return": 0,
    "class-methods-use-this": 0,
    "import/no-dynamic-require": 0
  }
}
