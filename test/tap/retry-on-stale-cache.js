var path = require('path')

var mr = require('npm-registry-mock')
var test = require('tap').test
var common = require('../common-tap')

var server

// In this test we mock a situation where the user has a package in his cache,
// a newer version of the package is published, and the user tried to install
// said new version while requestion that the cache be used.
// npm should see that it doesn't have the package in its cache and hit the
// registry.

var initialFakePackage = {
  metadata: {
    'name': 'good-night',
    'dist-tags': {
      'latest': '0.1.0'
    },
    'versions': {
      '0.1.0': {
        'name': 'good-night',
        'version': '0.1.0',
        'dist': {
          'shasum': '2a746d49dd074ba0ec2d6ff13babd40c658d89eb',
          'tarball': 'http://registry.npmjs.org/good-night/-/good-night-0.1.0.tgz'
        }
      }
    }
  },

  tgzPath: path.resolve(__dirname, '../fixtures/good-night-0.1.0.tgz')
}

var initialMock = {
  '/good-night': [200, initialFakePackage.metadata],
  '/good-night/-/good-night-0.1.0.tgz': [200, initialFakePackage.tgzPath]
}

var improvedFakePackage = {
  metadata: {
    'name': 'good-night',
    'dist-tags': {
      'latest': '1.0.0'
    },
    'versions': {
      '0.1.0': {
        'name': 'good-night',
        'version': '0.1.0',
        'dist': {
          'shasum': '2a746d49dd074ba0ec2d6ff13babd40c658d89eb',
          'tarball': 'http://registry.npmjs.org/good-night/-/good-night-0.1.0.tgz'
        }
      },
      '1.0.0': {
        'name': 'good-night',
        'version': '1.0.0',
        'dist': {
          'shasum': 'f377bf002a0a8fc4085d347a160a790b76896bc3',
          'tarball': 'http://registry.npmjs.org/good-night/-/good-night-1.0.0.tgz'
        }
      }
    }
  },

  tgzPath: path.resolve(__dirname, '../fixtures/good-night-1.0.0.tgz')
}

test('setup initial server', function (t) {
  mr({
    port: common.port,
    throwOnUnmatched: true,

    mocks: {
      get: initialMock
    }
  }, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    server = s

    t.end()
  })
})

test('install initial version', function (t) {
  common.npm([
    '--registry', common.registry,
    'install', 'good-night'
  ], {}, function (err, code) {
    t.ifError(err, 'initial install command finished succesfully')
    t.notOk(code, 'initial install succeeded')

    t.end()
  })
})

test('setup new server', function (t) {
  server.close()

  mr({
    port: common.port,
    throwOnUnmatched: true
  }, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    server = s

    server.get('/good-night')
      .many({ min: 1, max: 1 })
      .reply(200, correctRegistry(improvedFakePackage.metadata))

    server.get('/good-night/-/good-night-1.0.0.tgz')
      .many({ min: 1, max: 1 })
      .replyWithFile(200, improvedFakePackage.tgzPath)

    t.end()
  })
})

test('install new version', function (t) {
  common.npm([
    '--cache-min', 'Infinity',
    '--registry', common.registry,
    'install', 'good-night@1.0.0'
  ], {}, function (err, code) {
    t.ifError(err, 'install command finished succesfully')
    t.notOk(code, 'install succeeded')

    t.end()
  })
})

test('install does not hit server again', function (t) {
  // The mock server route definitions ensure we don't hit the server again
  common.npm([
    '--cache-min', 'Infinity',
    '--registry', common.registry,
    'install', 'good-night'
  ], {}, function (err, code, stdout) {
    t.ifError(err, 'install command finished succesfully')
    t.notOk(code, 'install succeeded')

    t.ok(/@1\.0\.0/.test(stdout), 'installed latest version')

    server.done()

    t.end()
  })
})

test('cleanup', function (t) {
  server.close()
  t.end()
})

function correctRegistry (obj, port) {
  return JSON.stringify(obj)
    .replace(/http:\/\/registry\.npmjs\.org/ig,
             'http://localhost:' + common.port)
}
