module.exports = function resolvePackage(setup) {
  const dependencies = [
    "@ionic/react",
    "@ionic/react-router",
  ]

  const devDependencies = [
    "@capacitor/android",
    "@capacitor/cli",
    "@capacitor/core",
    "@ionic/cli"
  ]

  const packageJson = setup.packageJson
  packageJson.scripts["prepare:android"] = "ionic cap add android && ionic cap copy android"

  return {
    ...setup,
    packageJson,
    dependencies: [...setup.dependencies, ...dependencies],
    devDependencies: [...setup.devDependencies, ...devDependencies],
  }
}
