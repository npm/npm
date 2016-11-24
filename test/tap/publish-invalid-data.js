var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../lib/npm.js')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var path = require('path')
var fs = require('fs')
var mr = require('npm-registry-mock')

var osenv = require('osenv')

var PKG_DIR = path.resolve(__dirname, 'publish-invalid-data')
var CACHE_DIR = path.resolve(PKG_DIR, 'cache')

var DEFAULT_PKG = {
  'name': 'examples',
  'version': '1.2.3'
}

var mockServer

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
  rimraf.sync(CACHE_DIR)
  mkdirp.sync(CACHE_DIR)

  var pkg = clone(DEFAULT_PKG)

  if (options.name) {
    pkg.name = options.name
  }

  if (options.version) {
    pkg.version = options.version
  }

  pkg = JSON.stringify(pkg)

  fs.writeFileSync(path.resolve(PKG_DIR, 'package.json'), pkg)
}

test('setup', function (t) {
  process.chdir(osenv.tmpdir())
  mkdirp.sync(PKG_DIR)
  process.chdir(PKG_DIR)

  resetPackage({})

  mr({ port: common.port }, function (er, server) {
    npm.load({
      cache: CACHE_DIR,
      registry: common.registry,
      cwd: PKG_DIR
    }, function (err) {
      t.ifError(err, 'started server')
      mockServer = server

      t.end()
    })
  })
})

test('attempt publish with invalid name', function (t) {
  resetPackage({name: ' examples'})

  npm.commands.publish([], function (err) {
    t.notEqual(err, null)
    t.same(err.message, 'Invalid name: " examples"')
    t.end()
  })
})

test('attempt publish with invalid version', function (t) {
  resetPackage({version: '1.3.00'})

  npm.commands.publish([], function (err) {
    t.notEqual(err, null)
    t.same(err.message, 'Invalid version: "1.3.00"')
    t.end()
  })
})

test('attempt force publish with invlid name', function (t) {
  resetPackage({name: ' examples'})

  mockServer.filteringRequestBody(function (body) {
    return true
  }).put('/examples', true).reply(201, {ok: true})

  common.npm([
    'publish',
    '--force',
    '--loglevel', 'silly',
    '--cache', path.join(PKG_DIR, 'cache'),
    '--registry', common.registry
  ],
  {
    'cwd': PKG_DIR
  },
  function (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'published without error')
    mockServer.done()
    t.end()
  })
})

test('attempt force publish with invalid version', function (t) {
  resetPackage({version: '1.3.00'})

  mockServer.filteringRequestBody(function (body) {
    return true
  }).put('/examples', true).reply(201, {ok: true})

  common.npm([
    'publish',
    '--force',
    '--loglevel', 'silly',
    '--cache', path.join(PKG_DIR, 'cache'),
    '--registry', common.registry
  ],
  {
    'cwd': PKG_DIR
  },
  function (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'published without error')
    mockServer.done()
    t.end()
  })
})

test('cleanup', function (t) {
  mockServer.close()

  process.chdir(osenv.tmpdir())
  rimraf.sync(PKG_DIR)

  t.end()
})
