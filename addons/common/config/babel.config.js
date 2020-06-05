module.exports = {
  presets: [
    [
      "env",
      {
        targets: {
          node: "12.14"
        }
      }
    ],
    "@babel/preset-react",
    "@babel/preset-env",
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "react-hot-loader/babel",
    [
      "module-resolver",
      {
        root: [
          "."
        ],
        alias: {
          app: "./src"
        }
      }
    ]
  ]
};