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
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended"
  ],
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": path.join(__dirname, 'config', 'webpack.common.js')
      }
    }
  },
  "parserOptions": {
    "ecmaVersion": 2018,
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
}
