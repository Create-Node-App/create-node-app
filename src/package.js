const _ = require('underscore');
const { getAddonPackagePath } = require('./paths');

module.exports = async function resolvePackage({ addons = [], ...config } = {}) {
  const { packageJson, dependencies, devDependencies } = await addons.reduce(
    async (setupPromise, addon) => {
      const setup = await setupPromise;
      try {
        const resolveAddonPackage = require(await getAddonPackagePath(addon));
        return resolveAddonPackage(setup, config);
      } catch (err) {
        return setup;
      }
    },
    Promise.resolve({ packageJson: {}, dependencies: [], devDependencies: [] })
  );

  return { packageJson, dependencies, devDependencies };
};
