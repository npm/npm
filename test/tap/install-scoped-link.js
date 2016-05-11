var exec = require('child_process').exec
var fs = require('graceful-fs')
var path = require('path')
var existsSync = fs.existsSync || path.existsSync

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var escapeExecPath = require('../../lib/utils/escape-exec-path')

var common = require('../common-tap.js')

var base = path.join(__dirname, path.basename(__filename, '.js'))
var pkg = path.join(base, 'pkg')
var work = path.join(base, 'work')
var modules = path.join(work, 'node_modules')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir

var EXEC_OPTS = { cwd: work }

var fixture = new Tacks(Dir({
  'pkg': Dir({
    'package.json': File({
      name: '@scoped/package',
      version: '0.0.0',
      bin: {
        hello: './world.js'
      }
    }),
    'world.js': File(
      '#!/usr/bin/env node\n' +
      'console.log("hello blrbld")\n'
    )
  }),
  'work': Dir({
    'node_modules': Dir()
  })
}))

test('setup', function (t) {
  cleanup()
  fixture.create(base)
  t.end()
})

test('installing package with links', function (t) {
  common.npm(
    [
      '--loglevel', 'silent',
      'install', pkg
    ],
    EXEC_OPTS,
    function (err, code) {
      t.ifError(err, 'install ran to completion without error')
      t.notOk(code, 'npm install exited with code 0')

      t.ok(
        existsSync(path.join(modules, '@scoped', 'package', 'package.json')),
        'package installed'
      )
      t.ok(existsSync(path.join(modules, '.bin')), 'binary link directory exists')

      var hello = path.join(modules, '.bin', 'hello')
      t.ok(existsSync(hello), 'binary link exists')

      exec(escapeExecPath(hello), function (err, stdout, stderr) {
        t.ifError(err, 'command ran fine')
        t.notOk(stderr, 'got no error output back')
        t.equal(stdout, 'hello blrbld\n', 'output was as expected')

        t.end()
      })
    }
  )
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  fixture.remove(base)
}
