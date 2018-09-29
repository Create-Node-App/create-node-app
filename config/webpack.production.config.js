const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin')

const commonPaths = require('./common-paths')

const config = {
  output: {
    filename: 'bundle.js',
    path: commonPaths.outputServerPath,
    publicPath: '/'
  },
  devtool: 'source-map',
  mode: 'production',
  plugins: [
    new UglifyJsWebpackPlugin({
      sourceMap: true
    }),
    new CleanWebpackPlugin([
      commonPaths.outputServerPath
    ], {
      root: commonPaths.root
    }),
    new CopyWebpackPlugin([
      {
        from: commonPaths.template,
        to: commonPaths.templatesOutputServerPath,
        transform: content => {
          return Buffer.from(
            content.toString().replace(new RegExp('{{base}}', 'g'), '/'),
            'utf8'
          )
        }
      },
      {
        from: commonPaths.favicon,
        to: commonPaths.outputServerPath,
      }
    ]),
  ]
}

module.exports = config
