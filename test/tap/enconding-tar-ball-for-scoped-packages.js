'use strict'
var test = require('tap').test
var npm = require('../../lib/npm')
var stream = require('readable-stream')

var moduleName = 'xyzzy-wibble'
var testModule = {
  name: moduleName,
  'dist-tags': {
    latest: '1.3.0'
  },
  versions: {
    '1.3.0': {
      name: moduleName,
      version: '1.3.0',
      dist: {
        shasum: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        tarball: 'https://registry.npmjs.org/xyzzy-wibble/-/xyzzy-wibble-1.3.0.tgz'
      }
    }
  }
}

var scopedModuleName = '@scope/xyzzy-wibble'
var scopedTestModule = {
  name: scopedModuleName,
  'dist-tags': {
    latest: '1.8.0'
  },
  versions: {
    '1.8.0': {
      name: scopedModuleName,
      version: '1.8.0',
      dist: {
        shasum: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        tarball: 'https://registry.npmjs.org/@scope/xyzzy-wibble/-/@scope/xyzzy-wibble-1.8.0.tgz'
      }
    }
  }
}

var lastTarball

test('setup', function (t) {
  npm.load({loglevel: 'silly'}, function (a, b) {
    npm.registry = {
      fetch: function (u, opts, cb) {
        lastTarball = u

        setTimeout(function () {
          var empty = new stream.Readable()
          empty.push(null)
          cb(null, empty)
        })
      }
    }
    t.end()
  })
})

var addNamed = require('../../lib/cache/add-named.js')
test('verify_regular_module', function (t) {
  t.plan(2)

  // tarball for regular module is not encoded
  addNamed('xyzzy-wibble', '*', testModule, function (err, pkg) {
    t.error(err, 'Succesfully resolved regular module')
    t.is(lastTarball, 'https://registry.npmjs.org/xyzzy-wibble/-/xyzzy-wibble-1.3.0.tgz')
  })
})

test('verify_scoped_module', function (t) {
  t.plan(2)

  // tarball for scoped module is encoded
  addNamed('@scope/xyzzy-wibble', '*', scopedTestModule, function (err, pkg) {
    t.error(err, 'Succesfully resolved scoped module')
    t.is(lastTarball, 'https://registry.npmjs.org/@scope%2fxyzzy-wibble/-/@scope%2fxyzzy-wibble-1.8.0.tgz')
  })
})
