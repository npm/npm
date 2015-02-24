var test = require('tap').test
var fs = require('fs')
var path = require('path')
var existsSync = fs.existsSync || path.existsSync
var npm = require('../../')
var rimraf = require('rimraf')
var osenv = require('osenv')
var mr = require('npm-registry-mock')
var common = require('../common-tap.js')
var server

var pkg = path.resolve(__dirname, 'circular-dep')

test('installing a package that depends on the current package', function (t) {
  t.plan(1)

  setup(function () {
    npm.install('optimist', function (err) {
      if (err) return t.fail(err)
      npm.dedupe(function (err) {
        if (err) return t.fail(err)
        t.ok(existsSync(path.resolve(pkg,
          'minimist', 'node_modules', 'optimist',
          'node_modules', 'minimist'
        )), 'circular dependency uncircled')
        cleanup()
        server.close()
      })
    })
  })
})

function setup (cb) {
  cleanup()
  process.chdir(path.resolve(pkg, 'minimist'))

  fs.mkdirSync(path.resolve(pkg, 'minimist/node_modules'))
  mr({port : common.port}, function (er, s) {
    server = s
    npm.load({
      loglevel: 'silent',
      registry: common.registry,
      cache: path.resolve(pkg, 'cache')
    }, cb)
  })
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(path.resolve(pkg, 'minimist/node_modules'))
  rimraf.sync(path.resolve(pkg, 'cache'))
}
