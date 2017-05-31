var npm = require.resolve('../../')
var test = require('tap').test
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var common = require('../common-tap.js')
var cache = path.resolve(__dirname, 'cache-process-uptime')
var execFile = require('child_process').execFile
var pkg = path.resolve(__dirname, '..', 'packages', 'npm-test-test-package')
var nm = path.resolve(pkg, 'node_modules')
var server

test('mock reg', function (t) {
  rimraf.sync(cache)
  mkdirp.sync(cache)
  mr({ port: common.port }, function (er, s) {
    server = s
    t.pass('ok')
    t.end()
  })
})

test('npm install with cache-min shorter than install', function (t) {
  rimraf.sync(nm)
  execFile(process.execPath, [
    npm,
    '--cache=' + cache,
    '--registry=' + common.registry,
    '--loglevel=silly',
    // has to be > 0 or caching is disabled, but less than uptime, and since
    // node startup time is 10s of ms and this is 0.1ms, it should always be
    // less than process.uptime()
    '--cache-min=0.00001',
    '--cache-max=Infinity',
    'install', 'underscore@1.5.1'
  ], {cwd: pkg}, function (err, stdout, stderr) {
    t.ifErr(err, 'Should not error')
    t.match(stderr, /^npm sill get cache (hit|miss) with timeout \d/m)
    t.notMatch(stderr, /^npm sill get cache (hit|miss) with timeout 0\.00001$/m)
    t.end()
  })
})

test('npm install with cache-min longer than install', function (t) {
  rimraf.sync(nm)
  execFile(process.execPath, [
    npm,
    '--cache=' + cache,
    '--registry=' + common.registry,
    '--loglevel=silly',
    '--cache-min=60',
    '--cache-max=Infinity',
    'install', 'underscore@1.5.1'
  ], {cwd: pkg}, function (err, stdout, stderr) {
    t.ifErr(err, 'Should not error')
    t.match(stderr, /^npm sill get cache (hit|miss) with timeout 60$/m)
    t.end()
  })
})

test('cleanup', function (t) {
  server.close()
  rimraf.sync(nm)
  rimraf.sync(cache)
  t.end()
})
