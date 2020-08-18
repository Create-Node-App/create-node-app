module.exports = function resolvePackage(setup) {
  const dependencies = [
    'semantic-ui-less',
    'semantic-ui-react',
  ]

  const devDependencies = [
    'less@2.7.3',
    'less-loader@^5.0.0',
  ]

  return {
    ...setup,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [
      ...setup.devDependencies.filter((dep) => dep !== "less" && dep !== "less-loader"),
      ...devDependencies
    ],
  }
}