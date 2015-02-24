var test = require('tap').test
var npm = require('../../')
var mr = require('npm-registry-mock')
var common = require('../common-tap.js')
var path = require('path')
var fs = require('fs')
var osenv = require('osenv')
var rimraf = require('rimraf')
var pkg = path.resolve(__dirname, 'shrinkwrap-empty-deps')
var cache = path.resolve(pkg, 'cache')

test('returns a list of removed items', function (t) {
  var desiredResultsPath = path.resolve(pkg, 'npm-shrinkwrap.json')

  cleanup()

  mr({port : common.port}, function (er, s) {
    setup(function () {
      npm.shrinkwrap([], function (err) {
        if (err) return t.fail(err)
        fs.readFile(desiredResultsPath, function (err, desired) {
          if (err) return t.fail(err)
          t.deepEqual({
            'name': 'npm-test-shrinkwrap-empty-deps',
            'version': '0.0.0',
            'dependencies': {}
          }, JSON.parse(desired))
          cleanup()
          s.close()
          t.end()
        })
      })
    })
  })
})

function setup (cb) {
  cleanup()
  process.chdir(pkg)
  npm.load({cache: cache, registry: common.registry}, function () {
    cb()
  })
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(path.resolve(pkg, 'npm-shrinkwrap.json'))
}
