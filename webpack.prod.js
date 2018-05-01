const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: './bin/npm-cli-entry.js',
  target: 'node',
  node: {
    __filename: true,
    __dirname: true,
  },

  externals: [ 'update-notifier' ],
  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'release'),
    libraryTarget: 'commonjs2'
  },

  mode: 'none',
}

if (require.main === module) {
  webpack(module.exports, (err, stats) => {
    if (err) { 
      console.err(err.stack)
      process.exit(1)
     }
     console.log(stats.toString())
  })
}
