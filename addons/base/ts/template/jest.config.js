module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest"
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/config/jest/fileMock.js",
    "\\.(css|sass|less)$": "<rootDir>/config/jest/styleMock.js"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx|js|jsx)?$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      diagnostics: {
        warnOnly: true
      }
    }
  },

  // Setup Enzyme
  snapshotSerializers: [
    "enzyme-to-json/serializer"
  ],
  setupFilesAfterEnv: [
    "<rootDir>/config/jest/enzyme.js"
  ]
};
