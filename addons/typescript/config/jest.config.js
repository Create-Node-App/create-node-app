module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      diagnostics: {
        warnOnly: true
      }
    }
  },

  // Setup Enzyme
  snapshotSerializers: ["enzyme-to-json/serializer"],
  setupTestFrameworkScriptFile: "<rootDir>/config/jest/enzyme.js"
};
