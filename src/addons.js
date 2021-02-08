module.exports = (options) => {
  // const lang = options.typescript ? 'ts' : 'es';

  // initialized with base template
  let addons = [];

  if (options.extend) {
    addons.push(
      ...String(options.extend)
        .split(',')
        .map((addon) => {
          return { addon, git: true };
        })
    );
  }

  return addons;
};
