const path = require('path');

module.exports = {
  context: path.resolve(__dirname, '../'),
  root: path.resolve(__dirname, '../../'),
  sourcePath: path.resolve(__dirname, '../', 'src/'),

  devEnv: path.resolve(__dirname, '../', process.env.DEV_ENV_FILE || '.env.development'),
  prodEnv: path.resolve(__dirname, '../', process.env.PROD_ENV_FILE || '.env.production'),

  entryPoints: [
    path.resolve(__dirname, '../', 'src/index.tsx'),
  ],

  outputPath: path.resolve(__dirname, '../', process.env.DEV_BUILD_DIR || 'build/'),
  outputServerPath: path.resolve(__dirname, '../', process.env.PROD_BUILD_DIR || 'build/'),
  templatesOutputServerPath: path.resolve(__dirname, '../', process.env.PROD_TEMPLATES_BUILD_DIR || process.env.PROD_BUILD_DIR || 'build/'),

  locales: path.resolve(__dirname, '../', 'static/locales/'),
  images: path.resolve(__dirname, '../', 'static/images/'),
  template: path.resolve(__dirname, '../', 'public/index.html'),
  favicon: path.resolve(__dirname, '../', 'public/favicon.ico'),
  manifest: path.resolve(__dirname, '../', 'public/manifest.json'),
  serviceWorker: path.resolve(__dirname, '../', 'src/', 'service-worker.js'),
};
