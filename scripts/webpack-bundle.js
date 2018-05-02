#!/usr/bin/env node

const BB = require('bluebird')

const commands = require('../lib/config/cmd-list.js')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const pkg = require('../package.json')
const webpack = require('webpack')

if (require.main === module) {
  BB.fromNode(cb => bundler().run(cb))
    .then(stats => {
      console.log(stats.toString({
        chunks: false,
        colors: true
      }))
    })
}

module.exports = bundler
function bundler (opts) {
  opts = opts || {}
  const dest = path.join(
    __dirname, '..', 'release', `${pkg.name}-${pkg.version}`
  )
  return webpack({
    context: path.join(__dirname, '..'),
    // devtool: 'source-map',
    target: 'node',
    node: false,
    module: {
      rules: [
        {test: /np.-cli.js$/, loader: 'shebang-loader'}
      ]
    },
    mode: opts.mode || process.env.NODE_ENV || 'production',
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    plugins: [
      new CopyWebpackPlugin([
        'package.json',
        // {
        //   from: path.join(__dirname, '..', 'bin/'),
        //   to: path.join(dest, 'bin/')
        // }
      ])
    ],
    entry: Object.assign({
      'lib/npm.js': require.resolve('../lib/npm.js'),
      'lib/install/action/extract-worker.js': require.resolve('../lib/install/action/extract-worker.js'),
      'bin/npm-cli.js': require.resolve('../bin/npm-cli.js'),
      'bin/npx-cli.js': require.resolve('../bin/npx-cli.js')
    }),
    output: {
      filename: '[name]',
      libraryTarget: 'commonjs2',
      path: dest
    }
  })
}

// function getCommands () {
//   return commands.cmdList.concat(commands.plumbing).map(cmd => {
//     return require.resolve('..', 'lib', `${cmd}.js`)
//   }).reduce((acc, p) => {
//     acc[path.join('lib', `${path.basename(p)}`)] = p
//     return acc
//   })
// }
