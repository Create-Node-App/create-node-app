const { toCamelCase } = require('./helpers');

const BASE_URL = 'ulises-jeremias/react-webpack-starter';

module.exports = (program) => {
  const lang = program.typescript ? 'ts' : 'es';
  const langAddons = [
    'redux',
    'saga',
    'recoil',
    'ant-design',
    'bootstrap',
    'material-ui',
    'semantic-ui',
  ];

  // initialized with base template
  let addons = [{ addon: 'base/common' }, { addon: `base/${lang}` }];

  langAddons.forEach((addon) => {
    if (program[toCamelCase(addon)]) {
      addons.push({ addon: `${BASE_URL}@addon/${addon}#type=common`, git: true });
      addons.push({ addon: `${BASE_URL}@addon/${addon}#type=${lang}`, git: true });
    }
  });

  if (program.android) {
    addons.push({ addon: 'android' });
  }
  if (program.docker) {
    addons.push({ addon: 'docker/web' });
    if (program.android) {
      addons.push({ addon: 'docker/android' });
    }
  }

  return addons;
};
