/* eslint-disable global-require */
const { existsSync } = require('fs');
const merge = require('lodash.merge');
const { getAddonPackagePath } = require('./paths');

const getInstallableSetup = ({ dependencies, devDependencies, ...packageJson }) => {
  const getInstallableDeps = (deps = {}) =>
    Object.entries(deps).map(([dep, version]) => `${dep}@${version}`);

  return {
    packageJson,
    dependencies: getInstallableDeps(dependencies),
    devDependencies: getInstallableDeps(devDependencies),
  };
};

const requireIfExists = (path) => {
  if (existsSync(path)) {
    return require(path);
  }

  throw new Error(`file ${path} not exists`);
};

module.exports = async ({ addons = [], ignorePackage: globalIgnorePackage, ...config } = {}) => {
  const setup = await addons.reduce(async (setupPromise, { addon, ignorePackage }) => {
    let packageJson = await setupPromise;

    try {
      const template = requireIfExists(await getAddonPackagePath(addon, 'template.json'));
      packageJson = merge(packageJson, template.package || {});
    } catch {
      // ignore this case since it failed executing the require of the `template.json`
    }

    try {
      const addonPackageJson = requireIfExists(
        await getAddonPackagePath(addon, 'package.json', globalIgnorePackage || ignorePackage)
      );
      return merge(packageJson, addonPackageJson);
    } catch {
      // ignore this case since it failed executing the require of the `package.json`
    }

    try {
      // apply updates using package module
      const resolveAddonPackage = requireIfExists(await getAddonPackagePath(addon));
      packageJson = resolveAddonPackage(packageJson, config);
    } catch {
      // ignore this case since it failed executing `resolveAddonPackage(...)`
    }
    return packageJson;
  }, Promise.resolve({ name: config.appName, dependencies: {}, devDependencies: {}, scripts: {} }));

  return getInstallableSetup(setup);
};
