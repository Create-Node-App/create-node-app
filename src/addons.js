module.exports = (options) => {
  // const lang = options.typescript ? 'ts' : 'es';

  // initialized with base template
  let addons = [];

  if (options.extend) {
    addons.push(...options.extend.map((addon) => ({ addon, git: true })));
  }

  return addons;
};
