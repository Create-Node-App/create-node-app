const commonPaths = require('./common-paths');

const config = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: commonPaths.outputPath,
    compress: true,
    historyApiFallback: true,
    hot: false,
    port: 9000
  }
};

module.exports = config;
