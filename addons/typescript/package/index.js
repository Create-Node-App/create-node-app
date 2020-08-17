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
  packageJson.scripts.lint = "prettier --check \"src/**/*.{js,jsx,ts,tsx}\""
  packageJson.scripts["lint:fix"] = "prettier --write \"src/**/*.{js,jsx,ts,tsx}\""

  return {
    ...setup,
    packageJson,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}
