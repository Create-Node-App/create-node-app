module.exports = function resolvePackage(setup) {
  const dependencies = [
    'connected-react-router',
    'history',
    'react-redux',
    'redux',
    'redux-cookie',
    'redux-form',
    'redux-logger',
    'redux-persist',
    'redux-thunk',
  ]

  const devDependencies = [
    'redux-mock-store',
  ]

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}