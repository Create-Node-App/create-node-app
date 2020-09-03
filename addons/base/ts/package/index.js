module.exports = function resolvePackage(setup) {
  const dependencies = []

  const devDependencies = [
    '@babel/preset-typescript',
    '@types/jest',
    '@types/enzyme',
    '@types/enzyme-adapter-react-16',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    '@types/react-router',
    '@types/react-router-dom',
    '@types/react-test-renderer',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'awesome-typescript-loader',
    'ts-jest',
    'typescript',
  ]

  const packageJson = setup.packageJson

  // update formater for ts and tsx files
  packageJson.scripts.lint = "prettier --ignore-path .eslintignore --check \"**/*.{js,jsx,ts,tsx,json,css,sass,scss,less,html,md}\""
  packageJson.scripts["lint:fix"] = "prettier --ignore-path .eslintignore --write \"**/*.{js,jsx,ts,tsx,json,css,sass,scss,less,html,md}\""

  // update pre-commit stage
  packageJson["lint-staged"] = {
    ...(packageJson["lint-staged"] || {}),
    "*.(ts|tsx)": [
      "prettier --write",
      "yarn lint:fix",
      "git add"
    ],
  }

  return {
    ...setup,
    packageJson,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}
