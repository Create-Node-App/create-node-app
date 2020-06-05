module.exports = {
  verbose: false,
  testRegex: '\\.test\\.js$',
  rootDir: '.',
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/config/jest/.enzyme.config.js'],
  modulePaths: [
    '<rootDir>/src',
  ],
  moduleNameMapper: {
    "^src$": "<rootDir>/src/"
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/test/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/test/__mocks__/styleMock.js"
  }
}
