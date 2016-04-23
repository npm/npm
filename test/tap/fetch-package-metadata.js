/**
 * Unit test for fetch-package-metadata
 */

var path = require('path')

var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')
var npm = npm = require('../../')

test('fetch-package-metadata provides resolved metadata', function (t) {
  t.plan(3)

  mr({ port: common.port }, function (er, s) {
    setup(function (err) {
      if (err) return t.fail(err)

      var fetchPackageMetadata = require('../../lib/fetch-package-metadata')

      var testPackage = {
        raw: 'test-package@>=0.0.0',
        scope: null,
        name: 'test-package',
        rawSpec: '>=0.0.0',
        spec: '>=0.0.0',
        type: 'range'
      }

      fetchPackageMetadata(testPackage, __dirname, function (err, pkg) {
        if (err) return t.fail(err)

        t.equals(pkg._resolved, 'http://localhost:1337/test-package/-/test-package-0.0.0.tgz')
        t.equals(pkg._shasum, 'b0d32b6c45c259c578ba2003762b205131bdfbd1')
        t.equals(pkg._from, 'test-package@>=0.0.0')
        s.close()
        t.end()
      })
    })
  })
})

// Test scaffold boilerplate

test('cleanup', function (t) {
  cleanup()
  t.end()
})

var pkg = path.resolve(__dirname, 'fetch-package-metadata')

function setup (cb) {
  cleanup()
  mkdirp.sync(pkg)
  process.chdir(pkg)

  var opts = {
    cache: path.resolve(pkg, 'cache'),
    registry: common.registry,
    // important to make sure devDependencies don't get stripped
    dev: true
  }
  npm.load(opts, cb)
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
