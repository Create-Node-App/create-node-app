/* eslint-disable global-require */
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

module.exports = async ({ addons = [], ignorePackage = false, ...config } = {}) => {
  const setup = await addons.reduce(async (setupPromise, { addon, git }) => {
    let packageJson = await setupPromise;

    try {
      if (!ignorePackage) {
        const addonPackageJson = require(await getAddonPackagePath(addon, git, 'package.json'));
        packageJson = merge(packageJson, addonPackageJson);
      }
    } catch (error) {
      // ignore this case since it failed executing the require of the `package.json`
    }

    try {
      const template = require(await getAddonPackagePath(addon, git, 'template.json'));
      packageJson = merge(packageJson, template.package || {});
    } catch (error) {
      // ignore this case since it failed executing the require of the `template.json`
    }

    try {
      // apply updates using package module
      const resolveAddonPackage = require(await getAddonPackagePath(addon, git));
      return resolveAddonPackage(packageJson, config);
    } catch (err) {
      return packageJson;
    }
  }, Promise.resolve({ dependencies: {}, devDependencies: {}, scripts: {} }));

  return getInstallableSetup(setup);
};
