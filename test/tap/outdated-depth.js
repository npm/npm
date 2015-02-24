var common = require('../common-tap')
var path = require('path')
var test = require('tap').test
var rimraf = require('rimraf')
var npm = require('../../')
var mr = require('npm-registry-mock')
var pkg = path.resolve(__dirname, 'outdated-depth')
var cache = path.resolve(pkg, 'cache')
var nodeModules = path.resolve(pkg, 'node_modules')

function cleanup () {
  rimraf.sync(nodeModules)
  rimraf.sync(cache)
}

test('outdated depth zero', function (t) {
  var expected = [
    pkg,
    'underscore',
    '1.3.1',
    '1.3.1',
    '1.5.1',
    '1.3.1'
  ]

  process.chdir(pkg)

  mr({port : common.port}, function (er, s) {
    npm.load({
      cache: cache
    , loglevel: 'silent'
    , registry: common.registry
    }
    , function () {
        npm.install('.', function (er) {
          if (er) throw new Error(er)
          npm.outdated(function (err, d) {
            if (err) throw new Error(err)
            t.deepEqual(d[0], expected)
            s.close()
            t.end()
          })
        })
      }
    )
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
