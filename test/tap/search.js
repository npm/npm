var path = require('path')
var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var osenv = require('osenv')
var rimraf = require('rimraf')
var cacheFile = require('npm-cache-filename')
var test = require('tap').test
var Tacks = require('tacks')
var File = Tacks.File

var common = require('../common-tap.js')

var PKG_DIR = path.resolve(__dirname, 'search')
var CACHE_DIR = path.resolve(PKG_DIR, 'cache')
var cacheBase = cacheFile(CACHE_DIR)(common.registry + '/-/all')
var cachePath = path.join(cacheBase, '.cache.json')

var npm = require('../../lib/npm')

var server

test('setup', function (t) {
  mr({port: common.port, throwOnUnmatched: true}, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    server = s
    t.pass('all set up')
    t.done()
  })
})

test('notifies when there are no results', function (t) {
  setup()
  server.get('/-/v1/search?text=none&size=20').once().reply(200, {
    objects: []
  })
  common.npm([
    'search', 'none',
    '--registry', common.registry,
    '--loglevel', 'error'
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.match(stdout, /No matches found/, 'Useful message on search failure')
    t.done()
  })
})

test('spits out a useful error when no cache nor network', function (t) {
  setup()
  server.get('/-/v1/search?text=foo&size=20').once().reply(404, {})
  server.get('/-/all').many().reply(404, {})
  var cacheContents = {}
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'foo',
    '--registry', common.registry,
    '--loglevel', 'silly',
    '--json',
    '--fetch-retry-mintimeout', 0,
    '--fetch-retry-maxtimeout', 0,
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(code, 1, 'non-zero exit code')
    t.match(JSON.parse(stdout).error.summary, /No search sources available/)
    t.match(stderr, /No search sources available/, 'useful error')
    t.done()
  })
})

test('can switch to JSON mode', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: [
      { package: { name: 'cool', version: '1.0.0' } },
      { package: { name: 'foo', version: '2.0.0' } }
    ]
  })
  common.npm([
    'search', 'oo',
    '--json',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.deepEquals(JSON.parse(stdout), [
      { name: 'cool', version: '1.0.0', date: null },
      { name: 'foo', version: '2.0.0', date: null }
    ], 'results returned as valid json')
    t.done()
  })
})

test('JSON mode does not notify on empty', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: []
  })
  common.npm([
    'search', 'oo',
    '--json',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.deepEquals(JSON.parse(stdout), [], 'no notification about no results')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('can switch to tab separated mode', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: [
      { package: { name: 'cool', version: '1.0.0' } },
      { package: { name: 'foo', description: 'this\thas\ttabs', version: '2.0.0' } }
    ]
  })
  common.npm([
    'search', 'oo',
    '--parseable',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stdout, 'cool\t\t\tprehistoric\t1.0.0\t\nfoo\tthis has tabs\t\tprehistoric\t2.0.0\t\n', 'correct output, including replacing tabs in descriptions')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('tab mode does not notify on empty', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: []
  })
  common.npm([
    'search', 'oo',
    '--parseable',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stdout, '', 'no notification about no results')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('mute mode should not print results to stdout', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: [
      { package: { name: 'cool', version: '1.0.0' } },
      { package: { name: 'foo', description: 'this\thas\ttabs', version: '2.0.0' } }
    ]
  })
  common.npm([
    'search', 'oo',
    '--mute',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stdout, '', 'no results output')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('mute mode does not notify on empty', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: []
  })
  common.npm([
    'search', 'oo',
    '--mute',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stdout, '', 'no notification about no results')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('should include all data in JSON mode', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: [
      { package: { name: 'cool', version: '1.0.0', license: 'MIT', homepage: 'cool.where.net' } },
      { package: { name: 'foo', version: '2.0.0', license: 'BSD' } }
    ]
  })
  common.npm([
    'search', 'oo',
    '--json',
    '--full',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.deepEquals(JSON.parse(stdout), [
      { name: 'cool', version: '1.0.0', license: 'MIT', homepage: 'cool.where.net', date: null },
      { name: 'foo', version: '2.0.0', license: 'BSD', date: null }
    ], 'results returned as valid json')
    t.done()
  })
})

test('should pass string result to callback', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: [
      { package: { name: 'cool', version: '1.0.0' } },
      { package: { name: 'foo', description: 'this\thas\ttabs', version: '2.0.0' } }
    ]
  })
  npm.load({
    mute: true,
    registry: common.registry,
    loglevel: 'error',
    cache: CACHE_DIR
  }, function (err, npmObj) {
    if (err) throw err
    npmObj.config.set('json', false)
    npmObj.config.set('parseable', true)
    t.ok(npmObj, 'got value')
    t.type(npmObj, 'object', 'got configured object')
    npmObj.commands.search(['oo'], function (err, result) {
      if (err) throw err
      t.equal(result, 'cool\t\t\tprehistoric\t1.0.0\t\nfoo\tthis has tabs\t\tprehistoric\t2.0.0\t\n', 'correct output, including replacing tabs in descriptions')
      t.done()
    })
  })
})

test('should pass array of results to callback', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: [
      { package: { name: 'cool', version: '1.0.0' } },
      { package: { name: 'foo', description: 'some text', version: '2.0.0' } }
    ]
  })
  npm.load({
    mute: true,
    registry: common.registry,
    loglevel: 'error',
    cache: CACHE_DIR
  }, function (err, npmObj) {
    if (err) throw err
    npmObj.config.set('json', true)
    npmObj.config.set('parseable', false)
    t.ok(npmObj, 'got value')
    t.type(npmObj, 'object', 'got configured object')
    npmObj.commands.search(['oo'], function (err, result) {
      if (err) throw err
      t.ok(result, 'got result')
      t.type(result, Array, 'got array result')
      t.deepEquals(result, [
        { name: 'cool', version: '1.0.0', date: null },
        { name: 'foo', description: 'some text', version: '2.0.0', date: null }
      ], 'results returned as array')
      t.done()
    })
  })
})

test('should pass empty array to callback', function (t) {
  setup()
  server.get('/-/v1/search?text=oo&size=20').once().reply(200, {
    objects: []
  })
  npm.load({
    mute: true,
    registry: common.registry,
    loglevel: 'error',
    cache: CACHE_DIR
  }, function (err, npmObj) {
    if (err) throw err
    npmObj.config.set('json', true)
    npmObj.config.set('parseable', false)
    t.ok(npmObj, 'got value')
    t.type(npmObj, 'object', 'got configured object')
    npmObj.commands.search(['oo'], function (err, result) {
      if (err) throw err
      t.ok(result, 'got result')
      t.type(result, Array, 'got array result')
      t.equal(result.length, 0, 'got empty array')
      t.done()
    })
  })
})

test('no arguments provided should error', function (t) {
  cleanup()
  common.npm(['search'], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(code, 1, 'search finished unsuccessfully')

    t.match(
        stderr,
        /search must be called with arguments/,
        'should have correct error message'
    )
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  server.close()
  t.end()
})

function setup () {
  cleanup()
  mkdirp.sync(cacheBase)
}

function cleanup () {
  server.done()
  process.chdir(osenv.tmpdir())
  rimraf.sync(PKG_DIR)
}
