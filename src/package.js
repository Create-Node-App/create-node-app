const _ = require('underscore');

module.exports = function resolvePackage({ addons = [], ...config } = {}) {
  const { packageJson, dependencies, devDependencies } = addons.reduce(
    (setup, addon) => {
      try {
        const resolveAddonPackage = require(`../addons/${addon}/package`);
        return resolveAddonPackage(setup, config);
      } catch (err) {
        return setup;
      }
    },
    { packageJson: {}, dependencies: [], devDependencies: [] }
  );

  return { packageJson, dependencies, devDependencies };
};
