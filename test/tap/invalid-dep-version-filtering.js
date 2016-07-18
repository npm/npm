'use strict'
var path = require('path')
var test = require('tap').test
var rimraf = require('rimraf')
var mr = require('npm-registry-mock')
var mkdirp = require('mkdirp')
var common = require('../common-tap')

var testdir = path.join(__dirname, path.basename(__filename, '.js'))

var server

var pkgA = {
  name: 'pkg-a',
  'dist-tags': {
    latest: '1.0.0'
  },
  versions: {
    '1.0.0': {
      name: 'pkg-a',
      version: '1.0.0',
      dependencies: {
        'pkg-b': '1.0.0'
      },
      dist: {
        shasum: '3fbd9f4711a5234233dc6c9d7a052d4b9f83b416',
        tarball: 'http://registry.npmjs.org/mkdirp/-/mkdirp-0.0.1.tgz'
      }
    }
  }
}

var pkgB = {
  name: 'pkg-b',
  'dist-tags': {
    latest: '1.0.0'
  },
  versions: {
    '1.0.0': {
      name: 'pkg-b',
      version: '1.0.0',
      dist: {
        shasum: '3fbd9f4711a5234233dc6c9d7a052d4b9f83b416',
        tarball: 'http://registry.npmjs.org/mkdirp/-/mkdirp-0.0.1.tgz'
      }
    },
    '1.0.0rc1': {
      name: 'pkg-b',
      version: '1.0.0rc1',
      dist: {
        shasum: '3fbd9f4711a5234233dc6c9d7a052d4b9f83b416',
        tarball: 'http://registry.npmjs.org/mkdirp/-/mkdirp-0.0.1.tgz'
      }
    }
  }
}

function setup () {
  mkdirp.sync(path.join(testdir, 'node_modules'))
}
function cleanup () {
  rimraf.sync(testdir)
}

test('setup', function (t) {
  cleanup()
  setup()
  mr({ port: common.port, throwOnUnmatched: true }, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    server = s
    t.end()
  })
})

test('invalid versions should be ignored', function (t) {
  server.get('/pkg-a').reply(200, pkgA)
  server.get('/pkg-b').reply(200, pkgB)

  common.npm(
    [
      'install',
      '--registry', common.registry,
      'pkg-a@1.0.0'
    ],
    {cwd: testdir},
    function (er, code, stdout, stderr) {
      if (er) { throw er }
      t.equal(code, 0, 'install succeded')
      server.done()
      t.end()
    }
  )
})

test('cleanup', function (t) {
  server.close()
  cleanup()
  t.end()
})
