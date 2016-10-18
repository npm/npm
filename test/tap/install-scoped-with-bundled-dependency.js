'use strict'

var fs = require('fs')
var path = require('path')

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')
var pkg = path.join(__dirname, 'install-scoped-with-bundled-dependency')
var local = path.join(pkg, 'package')

var EXEC_OPTS = { }

var json = {
  name: '@scope/package',
  version: '0.0.0',
  dependencies: {
    'bundled-dep': '*'
  },
  bundledDependencies: [
    'bundled-dep'
  ]
}

var bundledJson = {
  name: 'bundled-dep',
  version: '0.0.0'
}

test('setup', function (t) {
  setup()

  t.end()
})

test('it should install dependencies of bundled dependencies', function (t) {
  var cmdArgs = ['install', '--loglevel=warn', './package']
  common.npm(cmdArgs, EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifError(err, 'install local package successful')
    t.equal(code, 0, 'npm install exited with code')
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function setup () {
  cleanup()
  mkdirp.sync(local)
  mkdirp.sync(path.resolve(pkg, 'node_modules'))
  fs.writeFileSync(
    path.join(local, 'package.json'),
    JSON.stringify(json, null, 2)
  )
  var bundled = path.resolve(local, 'node_modules/bundled-dep')
  mkdirp.sync(bundled)
  fs.writeFileSync(
    path.join(bundled, 'package.json'),
    JSON.stringify(bundledJson, null, 2)
  )
  process.chdir(pkg)
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
