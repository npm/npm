var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../lib/npm.js')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var path = require('path')
var mr = require('npm-registry-mock')
var sha = require('sha')
var fs = require('fs')

var osenv = require('osenv')

var requireInject = require('require-inject')

var PKG_DIR = path.resolve(__dirname, 'install-cache-mixcase')
var CACHE_DIR = path.resolve(PKG_DIR, 'cache')

// ** constant templates for mocks **
var DEFAULT_PKG = {
  'name': 'install-cache-mixcase',
  'version': '1.2.3',
  'dependencies': {
    'dep1': '*'
  }
}

var DEP1_PKG = {
  name: 'dep',
  version: '0.2.0'
}

var DEP1_TGZ_PATH = path.resolve(PKG_DIR, "dep-lowercase")

var DEP2_PKG = {
  name: 'Dep',
  version: '0.2.0'
}

var DEP2_TGZ_PATH = path.resolve(PKG_DIR, "dep-capital")

var INSTALLED = {
  dependencies: {
    'dep': '1.1.1'
  }
}

var DEP1_REGISTRY = { name: 'dep',
  'dist-tags': { latest: '0.2.0' },
  versions: {
      '0.2.0': {
          _id: 'dep@0.2.0',
          version: '0.2.0',
          dist: {
              tarball: common.registry + '/dep/-/dep-0.2.0.tgz',
              shasum: ''
          }                        
      }
  },
}

var DEP2_REGISTRY = { name: 'Dep',
  'dist-tags': { latest: '0.2.0' },
  versions: {
      '0.2.0': {
          _id: 'Dep@0.2.0',
          version: '0.2.0',
          dist: {
              tarball: common.registry + '/Dep/-/Dep-0.2.0.tgz',
              shasum: '208f074c2c445abe9ad34adeff6996ea17e45466'
          }                        
      }
  },
}

var registryMocks = {
  'get': {
    '/dep': [200, DEP1_REGISTRY],
    '/dep/-/dep-0.2.0.tgz': [200, DEP1_TGZ_PATH],
    '/Dep': [200, DEP2_REGISTRY],
    '/Dep/-/Dep-0.2.0.tgz': [200, DEP2_TGZ_PATH]
  }
}

// ** dynamic mocks, cloned from templates and modified **
var mockServer
var mockDepJson = clone(DEP1_PKG)
var mockInstalled = clone(INSTALLED)
var mockParentJson = clone(DEFAULT_PKG)

function clone (a) {
  return extend({}, a)
}

function extend (a, b) {
  for (var key in b) {
    a[key] = b[key]
  }
  return a
}

function resetPackage (options) {
//  rimraf.sync(CACHE_DIR)
  mkdirp.sync(CACHE_DIR)

  installAskedFor = undefined

  mockParentJson = clone(DEFAULT_PKG)
  mockInstalled = clone(INSTALLED)
  mockDepJson = clone(DEP1_PKG)

  if (options.wanted) {
    mockParentJson.dependencies.dep1 = options.wanted
    mockDepJson._from = options.wanted
  }

  if (options.installed) {
    mockInstalled.dependencies.dep1 = options.installed
    mockDepJson.version = options.installed
  }
}

test('setup', function (t) {
  process.chdir(osenv.tmpdir())
  mkdirp.sync(PKG_DIR)
  process.chdir(PKG_DIR)

  resetPackage({})

  t.end()
})

test('startRegistry', function(t) {
    
  mr({ port: common.port, mocks: registryMocks }, function (er, server) {
    npm.load({ cache: CACHE_DIR,
      registry: common.registry,
    cwd: PKG_DIR }, function (err) {
        t.ifError(err, 'started server')
        mockServer = server

        t.end()
      })
  })
})

test('make dep-lowercase', function (t) {
  // make dep-lowercase
    rimraf.sync('a');
    mkdirp.sync('a');
    process.chdir('a');
    fs.writeFileSync('package.json', JSON.stringify(DEP1_PKG));
    common.npm(['pack'], {}, function (err, code) {
        t.ifError(err)
        var s = sha.getSync('dep-0.2.0.tgz').toString('base64');
        DEP1_REGISTRY.versions['0.2.0'].dist.shasum = s
        process.stderr.write('sha: ' + s)
        fs.renameSync('dep-0.2.0.tgz', '../dep-lowercase');
        process.chdir(PKG_DIR)
        t.end()
    })

})

test('make dep-capital', function (t) {
  // make dep-capital
    rimraf.sync('a');
    mkdirp.sync('a');
    process.chdir('a');
    fs.writeFileSync('package.json', JSON.stringify(DEP2_PKG));
    common.npm(['pack'], {}, function (err, code) {
        t.ifError(err)
        fs.renameSync('Dep-0.2.0.tgz', '../dep-Capital');
        process.chdir(PKG_DIR)
        t.end()
    })

})

test('update caret dependency to latest', function (t) {
  resetPackage({})
  npm.config.set('loglevel', 'silly')

  npm.commands.install(['dep'], function (err) {
    t.ifError(err)
    // check that 'dep' is in cache
    t.end()
  })
})

test('cleanup', function (t) {
  mockServer.close()

  process.chdir(osenv.tmpdir())
//  rimraf.sync(PKG_DIR)

  t.end()
})
