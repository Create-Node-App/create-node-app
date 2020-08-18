module.exports = function resolvePackage(setup) {
  const dependencies = [
    '@material-ui/core',
    '@material-ui/icons',
  ]

  const devDependencies = []

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}