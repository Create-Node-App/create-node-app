module.exports = function resolvePackage(setup) {
  const dependencies = [
    'react-bootstrap',
    'bootstrap',
  ]

  const devDependencies = []

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}