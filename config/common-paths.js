const path = require('path');

module.exports = {
  outputPath: path.resolve(__dirname, '../', 'dist'),
  entryPath: path.resolve(__dirname, '../', 'src/index.js'),
  sourcePath: path.join(__dirname, '../', 'src'),
  root: path.resolve(__dirname, '../'),
  template: './public/index.html',
  favicon: './public/favicon.ico',
};
