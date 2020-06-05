const path = require('path');

module.exports = {
  context: path.resolve(__dirname, '../'),
  root: path.resolve(__dirname, '../../'),
  sourcePath: path.resolve(__dirname, '../', 'src/'),

  entryPoints: [
    path.resolve(__dirname, '../', 'src/containers/App.jsx'),
    path.resolve(__dirname, '../', 'src/index.jsx'),
  ],

  outputPath: path.resolve(__dirname, '../', 'dist/'),
  outputServerPath: path.resolve(__dirname, '../', 'build/'),
  templatesOutputServerPath: path.resolve(__dirname, '../', 'build/'),

  locales: path.resolve(__dirname, '../', 'static/locales/'),
  images: path.resolve(__dirname, '../', 'static/images/'),
  template: path.resolve(__dirname, '../', 'public/index.html'),
  favicon: path.resolve(__dirname, '../', 'public/favicon.ico'),
  manifest: path.resolve(__dirname, '../', 'public/manifest.json'),
};
