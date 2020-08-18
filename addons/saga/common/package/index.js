module.exports = function resolvePackage(setup) {
  const dependencies = [
    'redux-form-saga',
    'redux-saga',
  ]

  const devDependencies = []

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [
      ...setup.devDependencies.filter((dep) => dep !== 'redux-thunk'),
      ...devDependencies,
    ],
  }
}