module.exports = function resolvePackage(setup) {
  const dependencies = []

  const devDependencies = [
    '@types/jest',
    '@types/enzyme',
    '@types/enzyme-adapter-react-16',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    '@types/react-router',
    '@types/react-router-dom',
    '@types/react-test-renderer',
    'awesome-typescript-loader',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'prettier',
    'prettier-tslint',
    'tslint-config-prettier',
    'tslint-plugin-prettier',
    'ts-jest',
    'tslint',
    'tslint-config-prettier',
    'tslint-loader',
    'tslint-plugin-prettier',
    'tslint-react',
    'typescript',
  ]

  const packageJson = setup.packageJson
  packageJson.scripts.lint += " && prettier --check \"src/**/*.{ts,tsx}\""
  packageJson.scripts["lint:fix"] += " && prettier --write \"src/**/*.{ts,tsx}\""

  return {
    ...setup,
    packageJson,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}