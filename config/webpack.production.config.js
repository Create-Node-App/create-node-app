const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const config = {
  devtool: 'source-map',
  mode: 'production',
  plugins: [
    new UglifyJsWebpackPlugin({
      sourceMap: true
    })
  ]
};

module.exports = config;
