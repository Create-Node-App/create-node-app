module.exports = function resolvePackage(setup) {
  const dependencies = [
    'antd',
    '@ant-design/icons',
  ]

  const devDependencies = []

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}