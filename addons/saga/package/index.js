module.exports = function resolvePackage(setup) {
  const dependencies = [
    'connected-react-router',
    'history',
    'react-redux',
    'redux',
    'redux-form',
    'redux-form-saga',
    'redux-logger',
    'redux-persist',
    'redux-saga',
  ]

  const devDependencies = [
    'redux-mock-store',
  ]

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [
      ...setup.devDependencies.filter((dep) => dep !== 'redux-thunk'),
      ...devDependencies,
    ],
  }
}