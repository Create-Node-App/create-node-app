const webpack = require('webpack')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')

const commonPaths = require('./common-paths')

const config = {
  context: commonPaths.context,
  entry: [
    'babel-polyfill',
    commonPaths.entryPath,
  ],
  output: {
    filename: 'bundle.js',
    path: commonPaths.outputPath,
    publicPath: '/'
  },
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.(js|jsx)$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'eslint-loader',
      options: {
        failOnWarning: false,
        failOnError: true,
      },
    },
    {
      test: /\.(js|jsx)$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
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
      use: 'file-loader?name=fonts/[name].[hash].[ext]'
    },

    // the following 3 rules handle font extraction
    {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&mimetype=application/font-woff&name=fonts/[name].[hash].[ext]'
    },
    {
      test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader?name=fonts/[name].[hash].[ext]'
    },
    {
      test: /\.otf(\?.*)?$/,
      use: 'file-loader?name=fonts/[name].[ext]&mimetype=application/font-otf'
    }]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      src: commonPaths.sourcePath,
      'src-static': path.resolve(__dirname, '../', 'static/'),
      '../../theme.config$': path.resolve(__dirname, '../', 'src/styles/semantic-ui/theme.config'),
      heading: path.resolve(__dirname, '../', 'src/semantic/heading.less'),
    },
    modules: [
      'src',
      'node_modules'
    ]
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new ExtractTextWebpackPlugin('styles.css'),
    new CleanWebpackPlugin([commonPaths.outputPath], {
      root: commonPaths.root
    }),
    new CopyWebpackPlugin([
      {
        from: commonPaths.locales,
        to: 'locales',
        toType: 'dir'
      }
    ]),
  ]
}

module.exports = config
