module.exports = {
  extends: ["next", "@create-node-app/eslint-config-ts"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
  }
};
