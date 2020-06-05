const webpackMerge = require('webpack-merge');

const commonConfig = require('./config/webpack.common.js');

const getAddons = addonsArgs => {
  const addons = Array.isArray(addonsArgs)
    ? addonsArgs
    : [addonsArgs];

  return addons
    .filter(Boolean)
    .map(name => require(`./config/addons/webpack.${name}.js`));
};

module.exports = ({ env, addon }) => {
  const envConfig = require(`./config/webpack.${env || 'development'}.js`);

  return webpackMerge(commonConfig, envConfig, ...getAddons(addon));
};
