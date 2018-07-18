const webpack = require('webpack');
const path = require('path');
const CleanWebPackPlugin = require('clean-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

const commonPaths = require('./common-paths');

const config = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: commonPaths.outputPath
  },
  module: {
    rules: [
      /*{
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        loader: 'eslint-loader',
        options: {
          failOnWarning: false,
          failOnerror: true
        },
        exclude: /node_modules/
      },*/
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.s?css$/,
        use: ExtractTextWebpackPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader'
            }
          ]
        })
      },
      {
        test: /\.(eot|png|jpg|svg|[ot]tf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      playground: path.resolve(__dirname, '../', 'src'),
    }
  },
  optimization: {
    splitChunks: {
      filename: 'common.js',
      minChunks: 3,
      name: 'common'
    }
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new ExtractTextWebpackPlugin('styles.css'),
    new CleanWebPackPlugin(['dist'], { root: commonPaths.root }),
    new HtmlWebPackPlugin({
      template: commonPaths.template,
      favicon: commonPaths.favicon,
      inject: true
    })
  ]
};

module.exports = config;
