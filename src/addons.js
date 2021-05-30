module.exports = (options) => {
  // const lang = options.typescript ? 'ts' : 'es';

  // initialized with base template
  let addons = [];

  if (options.template) {
    addons = [{ addon: options.template }];
  }

  if (options.extend) {
    addons.push(...options.extend.filter(Boolean).map((addon) => ({ addon, git: true })));
  }

  return addons;
};
