module.exports = function resolvePackage(setup) {
  const dependencies = []

  const devDependencies = [
    '@types/redux-form',
    '@types/redux-logger',
    '@types/react-redux',
  ]

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}