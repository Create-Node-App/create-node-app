const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const config = {
  plugins: [
    new BundleAnalyzerPlugin(),
  ],
};

module.exports = config;
