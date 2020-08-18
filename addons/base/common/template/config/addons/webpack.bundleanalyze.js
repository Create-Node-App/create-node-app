const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const config = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: './report.html',
      openAnalyzer: true,
    }),
  ],
};

module.exports = config;
