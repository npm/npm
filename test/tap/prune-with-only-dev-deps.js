var fs = require('fs')
var path = require('path')

var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap')
var server

var pkg = path.resolve(__dirname, 'prune')
var cache = path.resolve(pkg, 'cache')

var json = {
  name: 'prune-with-only-dev-deps',
  description: 'fixture',
  version: '0.0.1',
  main: 'index.js',
  devDependencies: {
    'test-package-with-one-dep': '0.0.0',
    'test-package': '0.0.0'
  }
}

var EXEC_OPTS = {
  cwd: pkg,
  npm_config_depth: 'Infinity'
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(cache)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )
  mr({ port: common.port }, function (er, s) {
    server = s
    t.end()
  })
})

test('npm install', function (t) {
  common.npm([
    'install',
    '--cache', cache,
    '--registry', common.registry,
    '--loglevel', 'silent',
    '--production', 'false'
  ], EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifErr(err, 'install finished successfully')
    t.notOk(code, 'exit ok')
    t.notOk(stderr, 'Should not get data on stderr: ' + stderr)
    t.end()
  })
})

test('npm install test-package', function (t) {
  common.npm([
    'install', 'test-package',
    '--cache', cache,
    '--registry', common.registry,
    '--loglevel', 'silent',
    '--production', 'false'
  ], EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifErr(err, 'install finished successfully')
    t.notOk(code, 'exit ok')
    t.notOk(stderr, 'Should not get data on stderr: ' + stderr)
    t.end()
  })
})

test('verify installs', function (t) {
  var dirs = fs.readdirSync(pkg + '/node_modules').sort()
  t.same(dirs, [ 'test-package', 'test-package-with-one-dep' ].sort())
  t.end()
})

test('npm prune', function (t) {
  common.npm([
    'prune',
    '--loglevel', 'silent',
    '--production', 'false'
  ], EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifErr(err, 'prune finished successfully')
    t.notOk(code, 'exit ok')
    t.notOk(stderr, 'Should not get data on stderr: ' + stderr)
    t.end()
  })
})

test('verify installs', function (t) {
  var dirs = fs.readdirSync(pkg + '/node_modules').sort()
  t.same(dirs, [ 'test-package', 'test-package-with-one-dep' ])
  t.end()
})

test('npm prune', function (t) {
  common.npm([
    'prune',
    '--loglevel', 'silent',
    '--production'
  ], EXEC_OPTS, function (err, code, stderr) {
    t.ifErr(err, 'prune finished successfully')
    t.notOk(code, 'exit ok')
    t.equal(stderr,
      '- test-package@0.0.0 node_modules/test-package\n' +
      '- test-package-with-one-dep@0.0.0 node_modules/test-package-with-one-dep\n')
    t.end()
  })
})

test('verify installs', function (t) {
  var dirs = fs.readdirSync(pkg + '/node_modules').sort()
  t.same(dirs, [])
  t.end()
})

test('cleanup', function (t) {
  server.close()
  cleanup()
  t.pass('cleaned up')
  t.end()
})

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
