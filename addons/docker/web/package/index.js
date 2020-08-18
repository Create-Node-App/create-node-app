module.exports = function resolvePackage(setup, { appName, command }) {
  const packageJson = setup.packageJson

  packageJson.scripts = {
    ...packageJson.scripts,
    "docker:dev": `${command} docker:dev:build && ${command} docker:dev:start`,
    "docker:dev:build": `docker build -f docker/web/Dockerfile --target development -t ${appName} .`,
    "docker:dev:start": `docker run --rm -it --network host -v $PWD:/usr/src/app ${appName}`,
    "docker:prod": `${command} docker:prod:build && ${command} docker:prod:start`,
    "docker:prod:build": `docker build --build-arg API_BASE_URL=$API_BASE_URL -f docker/web/Dockerfile --target production -t ${appName}:production .`,
    "docker:prod:start": `docker run --rm -it --network host -e API_BASE_URL=$API_BASE_URL -v $PWD:/usr/src/app ${appName}:production`
  }

  return { ...setup, packageJson }
}
