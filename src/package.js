/* eslint-disable global-require */
const merge = require('lodash.merge');
const { getAddonPackagePath } = require('./paths');

module.exports = async ({ addons = [], ...config } = {}) => {
  const { packageJson, dependencies, devDependencies } = await addons.reduce(
    async (setupPromise, { addon, git }) => {
      let setup = await setupPromise;

      try {
        const addonPackageJson = require(await getAddonPackagePath(addon, git, true));
        // TODO: merge objects
        setup = merge(setup, addonPackageJson);
      } catch (error) {
        // ignore this case since it failed executing the require of the `package.json`
      }

      try {
        // apply updates using package module
        const resolveAddonPackage = require(await getAddonPackagePath(addon, git));
        return resolveAddonPackage(setup, config);
      } catch (err) {
        return setup;
      }
    },
    Promise.resolve({ packageJson: {}, dependencies: [], devDependencies: [] })
  );

  return { packageJson, dependencies, devDependencies };
};
