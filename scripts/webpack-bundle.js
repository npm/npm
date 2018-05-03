#!/usr/bin/env node

const BB = require('bluebird')

const commands = require('../lib/config/cmd-list.js')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackNodeExternals = require('webpack-node-externals')
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
function bundler(opts) {
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
        { test: /.js$/, loader: 'shebang-loader' }
      ]
    },
    mode: opts.mode || process.env.NODE_ENV || 'production',
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    externals: [
      WebpackNodeExternals({
        whitelist: [
          "abbrev",
          "ansi-regex",
          "ansicolors",
          "ansistyles",
          "aproba",
          "archy",
          "cacache",
          "call-limit",
          "bluebird",
          "bin-links",
          "byte-size",
          "chownr",
          "cli-table2",
          "cmd-shim",
          "columnify",
          "config-chain",
          "debuglog",
          "detect-indent",
          "detect-newline",
          "dezalgo",
          "editor",
          "figgy-pudding",
          "find-npm-prefix",
          "fs-vacuum",
          "fs-write-stream-atomic",
          "gentle-fs",
          "glob",
          "graceful-fs",
          "has-unicode",
          "hosted-git-info",
          "iferr",
          "imurmurhash",
          "inflight",
          "inherits",
          "ini",
          "init-package-json",
          "is-cidr",
          "json-parse-better-errors",
          "JSONStream",
          "lazy-property",
          "libcipm",
          "libnpmhook",
          "libnpx",
          "lockfile",
          "lodash._baseindexof",
          "lodash._baseuniq",
          "lodash._bindcallback",
          "lodash._cacheindexof",
          "lodash._createcache",
          "lodash._getnative",
          "lodash.clonedeep",
          "lodash.restparam",
          "lodash.union",
          "lodash.uniq",
          "lodash.without",
          "lru-cache",
          "meant",
          "mkdirp",
          "mississippi",
          "move-concurrently",
          "nopt",
          "normalize-package-data",
          "npm-audit-report",
          "npm-cache-filename",
          "npm-lifecycle",
          "npm-install-checks",
          "npm-package-arg",
          "npm-packlist",
          "npm-pick-manifest",
          "npm-profile",
          "npm-registry-client",
          "npm-registry-fetch",
          "npm-user-validate",
          "npmlog",
          "once",
          "opener",
          "osenv",
          "pacote",
          "path-is-inside",
          "promise-inflight",
          "query-string",
          "qrcode-terminal",
          "qw",
          "read",
          "read-cmd-shim",
          "read-installed",
          "read-package-json",
          "read-package-tree",
          "readable-stream",
          "readdir-scoped-modules",
          "request",
          "retry",
          "rimraf",
          "semver",
          "sha",
          "slide",
          "sorted-object",
          "sorted-union-stream",
          "ssri",
          "strip-ansi",
          "tar",
          "text-table",
          "uid-number",
          "umask",
          "unique-filename",
          "unpipe",
          "uuid",
          "validate-npm-package-license",
          "validate-npm-package-name",
          "which",
          "wrappy",
          "write-file-atomic",
          "safe-buffer",
          "tiny-relative-date",
          "cli-columns",
          "node-gyp"
        ]
      })
    ],
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
