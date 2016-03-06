var fs = require('graceful-fs')
var path = require('path')

var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')
var server

var pkg = path.resolve(__dirname, 'install-cli-silent')

var EXEC_OPTS = { cwd: pkg }

var json = {
  name: 'install-cli-silent',
  description: 'fixture',
  version: '0.0.1'
}

test('setup', function (t) {
  rimraf.sync(pkg)
  mkdirp.sync(pkg)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )
  mr({ port: common.port }, function (er, s) {
    t.ifError(er, 'started mock registry')
    server = s
    t.end()
  })
})

test('does not print dependency tree with --loglevel silent', function (t) {
  common.npm(
    [
      '--registry', common.registry,
      '--loglevel', 'silent',
      'install', 'async'
    ],
    EXEC_OPTS,
    function (err, code, stdout) {
      t.ifError(err, 'install --loglevel silent success')
      t.notOk(code, 'npm install exited with code 0')
      t.notOk(stdout.length, 'npm install should not print output')

      t.end()
    }
  )
})

test('cleanup', function (t) {
  server.close()
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)

  t.end()
})
