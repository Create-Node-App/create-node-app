module.exports = function resolvePackage(setup) {
  const dependencies = []

  const devDependencies = []

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}