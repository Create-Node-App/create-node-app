const path = require('path');

module.exports = {
  outputPath: path.resolve(__dirname, '../', 'dist'),
  root: path.resolve(__dirname, '../'),
  template: './public/index.html',
  favicon: './public/favicon.ico',
};
