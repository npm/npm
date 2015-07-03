var fs = require('graceful-fs')
var path = require('path')

var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var rimraf = require('rimraf')
var test = require('tap').test

var npm = require('../../')
var common = require('../common-tap.js')

// config
var pkg = path.resolve(__dirname, 'outdated-dist-tags')
var cache = path.resolve(pkg, 'cache')

var json = {
  name: 'outdated-dist-tags',
  description: 'fixture',
  version: '0.0.1',
  dependencies: {
    // Don't go past latest if possible
    'a-package': '^1.0.0',
    // If range is over latest, use biggest possible version
    'b-package': '^2.0.0',
    // If directly using a dist-tags, use it
    'c-package': 'next'
  }
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(cache)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )

  process.chdir(pkg)
  t.end()
})

test('it should not throw', function (t) {
  var expData = [
    [
      pkg,
      'a-package',
      undefined, // local
      '1.1.0', // wanted
      '1.1.0', // latest
      '^1.0.0', // range
      null
    ],
    [
      pkg,
      'b-package',
      undefined, // local
      '2.0.0', // wanted
      '1.1.0', // latest
      '^2.0.0', // range
      null
    ],
    [
      pkg,
      'c-package',
      undefined, // local
      '1.2.0', // wanted
      '1.1.0', // latest
      'next', // range
      null
    ]
  ]

  var customMocks = {
    'get': {
      '/a-package': [200, {
        name: 'a-package',
        'dist-tags': {latest: '1.1.0', next: '1.2.0'},
        versions: {
          '1.2.0': {version: '1.2.0'},
          '1.1.0': {version: '1.1.0'},
          '1.0.0': {version: '1.0.0'}
        }
      }],
      '/b-package': [200, {
        name: 'b-package',
        'dist-tags': {latest: '1.1.0', next: '2.0.0'},
        versions: {
          '2.0.0': {version: '2.0.0'},
          '1.1.0': {version: '1.1.0'},
          '1.0.0': {version: '1.0.0'}
        }
      }],
      '/c-package': [200, {
        name: 'c-package',
        'dist-tags': {latest: '1.1.0', next: '1.2.0'},
        versions: {
          '1.2.0': {version: '1.2.0'},
          '1.1.0': {version: '1.1.0'},
          '1.0.0': {version: '1.0.0'}
        }
      }]
    }
  }

  mr({ port: common.port, mocks: customMocks }, function (er, s) {
    npm.load(
      {
        cache: 'cache',
        loglevel: 'silent',
        parseable: true,
        registry: common.registry
      },
      function () {
        npm.outdated(function (er, d) {
          t.ifError(er, 'outdated success')

          t.same(d, expData)

          s.close()
          t.end()
        })
      }
    )
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  rimraf.sync(pkg)
}
