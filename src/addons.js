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
  let addons = [{
    addon: `${BASE_URL}@addon/base#type=common`,
    git: true
  }, {
    addon: `${BASE_URL}@addon/base#type=${lang}`,
    git: true
  }];

  langAddons.forEach((addon) => {
    if (program[toCamelCase(addon)]) {
      addons.push({ addon: `${BASE_URL}@addon/${addon}#type=common`, git: true });
      addons.push({ addon: `${BASE_URL}@addon/${addon}#type=${lang}`, git: true });
    }
  });

  if (program.android) {
    addons.push({ addon: `${BASE_URL}@addon/android`, git: true });
  }
  if (program.docker) {
    addons.push({ addon: `${BASE_URL}@addon/docker/web`, git: true });
    if (program.android) {
      addons.push({ addon: `${BASE_URL}@addon/docker/android`, git: true });
    }
  }

  return addons;
};
