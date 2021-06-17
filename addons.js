const { Options } = require('./docs');

/**
 * get addons from user options
 * @param {Options} options - Options specified by the user to create addons
 * @returns {{ addon: string, ignorePackage?: boolean }[]}
 */
module.exports = (options) => {
  // const lang = options.typescript ? 'ts' : 'es';

  // initialized with base template
  let addons = [];

  if (options.template) {
    addons = [{ addon: options.template }];
  }

  if (options.extend) {
    addons.push(...options.extend.filter(Boolean).map((addon) => ({ addon })));
  }

  return addons;
};
