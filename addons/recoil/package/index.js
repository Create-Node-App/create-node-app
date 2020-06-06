module.exports = function resolvePackage(setup) {
  const dependencies = [
    'recoil',
  ]

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
  }
}