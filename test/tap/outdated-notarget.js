// Fixes Issue # 1770
var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var osenv = require('osenv')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var pkg = path.resolve(__dirname, 'outdated-notarget')
var mr = require('npm-registry-mock')
var mockRoutes = {
  "get": {
    "/underscore/-/underscore-1.3.1.tgz": [200],
    "/underscore/-/underscore-1.7.1.tgz": [404, { ente: true }],
    "/underscore": [200,
      {
        '_id': 'underscore',
        name: 'underscore',
        version: '1.5.1',
        'dist-tags': { latest: '1.5.1' },
        versions: {
          '1.5.1': {
            name: 'underscore',
            'dist-tags': { latest: '1.5.1' }
          }
        }
      }
    ],
    "/underscore/1.7.1": [200,
      {
        '_id': 'underscore',
        name: 'underscore',
        version: '1.5.1',
        'dist-tags': { latest: '1.5.1' },
        versions: {
          '1.5.1': {
            name: 'underscore',
            'dist-tags': { latest: '1.5.1' }
          }
        }
      }
    ]
  }
}

test('outdated-notarget: if no viable version is found, show error', function(t) {
  setup()
  mr({port:common.port, mocks: mockRoutes}, function(s) {
    npm.load({ cache: path.resolve(pkg, 'cache'), registry: common.registry }, function() {
      npm.commands.update(function(er, d) {
        t.ok(er.code === 'ETARGET')
        s.close()
        t.end()
      })
    })
  })
})

test('cleanup', function(t) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  t.end()
})

function setup() {
  mkdirp.sync(pkg)
  mkdirp.sync(path.resolve(pkg, 'cache'))
  fs.writeFileSync(path.resolve(pkg, 'package.json'), JSON.stringify({
    author: 'Evan Lucas',
    name: 'outdated-notarget',
    version: '0.0.0',
    description: 'Test for outdated-notarget',
    dependencies: {
      'underscore': '~1.7.1'
    }
  }), 'utf8')
  process.chdir(pkg)
}

