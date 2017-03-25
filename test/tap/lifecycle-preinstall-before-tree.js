var fs = require('graceful-fs')
var path = require('path')

var basename = require('path').basename
var resolve = require('path').resolve
var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test
var extend = Object.assign || require('util')._extend

var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir

var common = require('../common-tap.js')

var pkg = path.resolve(__dirname, path.basename(__filename, '.js'))
var env = extend({}, process.env)

var base = resolve(__dirname, basename(__filename, '.js'))
var workingDir = resolve(base, 'working-dir')

var EXEC_OPTS = {
  cwd: workingDir,
  env: env
}

// Preinstall script creates a module named "test"
// in node_modules before tree is calculated
// If preinstall fires late then test fails
var preinstall_script = [
  "var w = require('fs').writeFileSync;",
  "var m = require('mkdirp').sync;",
  "var p = require('path');",
  "m(p.join(process.cwd(), 'node_modules', 'test'));",
  "var n = p.join(process.cwd(), 'node_modules', 'test', 'package.json');",
  "w(n, '{ \\\"name\\\": \\\"npmPreinstallDepIsNotARealDep\\\", \\\"version\\\": \\\"1.0.0\\\", \\\"description\\\": \\\"not a real dependency\\\"}')"
].join('');

var fixture = new Tacks(Dir({
  'working-dir': Dir({
    'node_modules': Dir({}), // so it doesn't try to install into npm's own node_modules
    'package.json': File({
      name: 'test-app',
      version: '1.0.0',
      dependencies: {
        'npmPreinstallDepIsNotARealDep': '1.0.0'
      },
      scripts: {
        preinstall: 'node -e "' + preinstall_script + '"'
      }
    })
  })
}))


test('setup', function (t) {
  cleanup()
  setup()

  t.end()
})

// Install "test" package using a fake registry
// Base app fixture defines preinstall that copies "test" to node_modules
// So will only succeed if preinstall happens before tree is calculated
test('preinstall fires before tree is calculated', function (t) {
  common.npm(
    [
      '--registry', 'https://127.0.0.11:1111', // fake registry
      'install'
    ],
    EXEC_OPTS,
    function (er, code) {
      if (er) throw er
      t.is(code, 0, 'preinstall fired before tree is calculated')

      t.end()
    }
  )
})

test('cleanup', function (t) {
  cleanup()

  t.end()
})

function cleanup () {
  fixture.remove(base)
  rimraf.sync(base)
}

function setup () {
  fixture.create(base)
}