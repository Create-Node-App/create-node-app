module.exports = {
  root: true,
  extends: ["@create-node-app/eslint-config"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
  }
};
