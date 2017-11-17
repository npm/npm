'use strict'

var common = require('../common-tap.js')
var npm = require('../../')
var test = require('tap').test
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var path = require('path')
var fs = require('fs')
var cacheFile = require('npm-cache-filename')
var mr = require('npm-registry-mock')
var ms = require('mississippi')
var Tacks = require('tacks')
var File = Tacks.File

var allPackageMetadata = require('../../lib/search/all-package-metadata.js')

var PKG_DIR = path.resolve(__dirname, 'update-index')
var CACHE_DIR = path.resolve(PKG_DIR, 'cache')
var cacheBase
var cachePath

var server

function setup () {
  mkdirp.sync(cacheBase)
}

function cleanup () {
  rimraf.sync(PKG_DIR)
}

test('setup', function (t) {
  mr({port: common.port, throwOnUnmatched: true}, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    npm.load({ cache: CACHE_DIR, registry: common.registry }, function (err) {
      t.ifError(err, 'npm loaded successfully')
      npm.config.set('cache', CACHE_DIR)
      cacheBase = cacheFile(npm.config.get('cache'))(common.registry + '/-/all')
      cachePath = path.join(cacheBase, '.cache.json')
      server = s
      t.pass('all set up')
      t.done()
    })
  })
})

test('allPackageMetadata full request', function (t) {
  setup()
  var updated = Date.now()
  server.get('/-/all').once().reply(200, {
    '_updated': 1234,
    'bar': { name: 'bar', version: '1.0.0' },
    'foo': { name: 'foo', version: '1.0.0' }
  }, {
    date: updated
  })
  var stream = allPackageMetadata(600)
  t.ok(stream, 'returned a stream')
  var results = []
  stream.on('data', function (pkg) {
    results.push(pkg)
  })
  ms.finished(stream, function (err) {
    if (err) throw err
    t.deepEquals(results, [{
      name: 'bar',
      version: '1.0.0'
    }, {
      name: 'foo',
      version: '1.0.0'
    }])
    var fileData = JSON.parse(fs.readFileSync(cachePath))
    t.ok(fileData, 'cache contents written to the right file')
    t.deepEquals(fileData, {
      '_updated': 1234,
      bar: {
        name: 'bar',
        version: '1.0.0'
      },
      foo: {
        name: 'foo',
        version: '1.0.0'
      }
    }, 'cache contents based on what was written')
    server.done()
    cleanup()
    t.end()
  })
})

test('allPackageMetadata cache only', function (t) {
  setup()
  var now = Date.now()
  var cacheContents = {
    '_updated': now,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  var stream = allPackageMetadata(10000000)
  t.ok(stream, 'returned a stream')
  var results = []
  stream.on('data', function (pkg) {
    results.push(pkg)
  })
  ms.finished(stream, function (err) {
    t.ifError(err, 'stream finished without error')
    t.deepEquals(
      results.map(function (pkg) { return pkg.name }),
      ['bar', 'cool', 'foo', 'other'],
      'packages deduped and sorted, without _updated'
    )
    var fileData = JSON.parse(fs.readFileSync(cachePath))
    t.ok(fileData, 'cache contents written to the right file')
    t.deepEquals(fileData, cacheContents, 'cacheContents written directly')
    server.done()
    cleanup()
    t.end()
  })
})

test('createEntryStream merged stream', function (t) {
  setup()
  var now = Date.now()
  var cacheTime = now - 601000
  var reqTime = (new Date(now)).toISOString()
  server.get('/-/all/since?stale=update_after&startkey=' + cacheTime).once().reply(200, {
    'bar': { name: 'bar', version: '2.0.0' },
    'car': { name: 'car', version: '1.0.0' },
    'foo': { name: 'foo', version: '1.0.0' }
  }, {
    date: reqTime
  })
  var fixture = new Tacks(File({
    '_updated': cacheTime,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }))
  fixture.create(cachePath)
  var stream = allPackageMetadata(600)
  t.ok(stream, 'returned a stream')
  var results = []
  stream.on('data', function (pkg) {
    results.push(pkg)
  })
  ms.finished(stream, function (err) {
    t.ifError(err, 'stream finished without error')
    t.deepEquals(
      results.map(function (pkg) { return pkg.name }),
      ['bar', 'car', 'cool', 'foo', 'other'],
      'packages deduped and sorted'
    )
    t.deepEquals(results[0], {
      name: 'bar',
      version: '2.0.0'
    }, 'update stream version wins on dedupe')
    t.deepEquals(results[3], {
      name: 'foo',
      version: '1.0.0'
    }, 'update stream version wins on dedupe even when the newer one has a lower semver.')
    var cacheContents = {
      '_updated': Date.parse(reqTime),
      bar: { name: 'bar', version: '2.0.0' },
      car: { name: 'car', version: '1.0.0' },
      cool: { name: 'cool', version: '1.0.0' },
      foo: { name: 'foo', version: '1.0.0' },
      other: { name: 'other', version: '1.0.0' }
    }
    var fileData = JSON.parse(fs.readFileSync(cachePath))
    t.ok(fileData, 'cache contents written to the right file')
    t.deepEquals(fileData, cacheContents, 'cache updated correctly')
    server.done()
    cleanup()
    t.end()
  })
})

test('allPackageMetadata no sources', function (t) {
  setup()
  server.get('/-/all').once().reply(404, {})
  var stream = allPackageMetadata(600)
  ms.finished(stream, function (err) {
    t.ok(err, 'no sources, got an error')
    t.match(err.message, /No search sources available/, 'useful error message')
    server.done()
    cleanup()
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  server.close()
  t.pass('all done')
  t.done()
})
