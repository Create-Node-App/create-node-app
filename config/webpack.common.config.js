const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

const commonPaths = require('./common-paths');

const config = {
  entry: commonPaths.entryPath,
  output: {
    filename: 'js/bundle.js',
    path: commonPaths.outputPath
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        loader: 'eslint-loader',
        options: {
          failOnWarning: false,
          failOnerror: true
        },
        exclude: /node_modules/
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: ExtractTextWebpackPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'less-loader']
        }),
      },
      // this rule handles images
      {
        test: /\.jpe?g$|\.gif$|\.ico$|\.png$|\.svg$/,
        use: 'file-loader?name=images/[name].[ext]?[hash]'
      },

      // the following 3 rules handle font extraction
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      },
      {
      test: /\.otf(\?.*)?$/,
      use: 'file-loader?name=/fonts/[name].[ext]&mimetype=application/font-otf'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      playground: commonPaths.sourcePath,
      '../../theme.config$': path.resolve(__dirname, '../src/semantic/theme.config'),
      heading: path.resolve(__dirname, '../src/semantic/heading.less'),
    },
    modules: [
      'src',
      'node_modules'
    ]
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new ExtractTextWebpackPlugin('css/styles.css'),
    new CleanWebpackPlugin(['dist'], {
      root: commonPaths.root
    }),
    new HtmlWebpackPlugin({
      template: commonPaths.template,
      favicon: commonPaths.favicon,
      inject: true
    })
  ]
};

module.exports = config;
