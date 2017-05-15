var fs = require('graceful-fs')
var path = require('path')
var existsSync = fs.existsSync || path.existsSync

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')

var pkg = path.join(__dirname, 'install-windows-newlines')

var EXEC_OPTS = { cwd: pkg }

var json = {
  name: 'install-windows-newlines',
  description: 'fixture',
  version: '0.0.0',
  dependencies: {
    dependency: 'file:./cli-dependency'
  }
}

var dependency = {
  name: 'cli-dependency',
  description: 'fixture',
  version: '0.0.0',
  bin: {
    hashbang: './hashbang.js',
    nohashbang: './nohashbang.js'
  }
}

test('setup', function (t) {
  mkdirp.sync(path.join(pkg, 'cli-dependency'))
  fs.writeFileSync(
    path.join(pkg, 'cli-dependency', 'package.json'),
    JSON.stringify(dependency, null, 2)
  )
  fs.writeFileSync(
    path.join(pkg, 'cli-dependency', 'hashbang.js'),
    '#!/usr/bin/env node\r\nconsole.log(\'Hello, world!\')\r\n'
  )
  fs.writeFileSync(
    path.join(pkg, 'cli-dependency', 'nohashbang.js'),
    '\'use strict\'\r\nconsole.log(\'Goodbye, world!\')\r\n'
  )

  mkdirp.sync(path.join(pkg, 'node_modules'))
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )

  process.chdir(pkg)
  common.npm(['install'], EXEC_OPTS, function (err, code) {
    t.ifError(err, 'install successful')
    t.equal(code, 0, 'npm install did not raise error code')
    t.ok(
      existsSync(path.resolve(pkg, 'node_modules/cli-dependency/hashbang.js')),
      'cli installed'
    )
    t.ok(
      existsSync(path.resolve(pkg, 'node_modules/cli-dependency/hashbang.js')),
      'cli installed'
    )
    t.end()
  })
})

test('\'npm install\' should convert newlines to Unix/Linux style in hashbang cli scripts', function (t) {
  t.notOk(
    fs.readFileSync(
      path.resolve(pkg, 'node_modules/cli-dependency/hashbang.js'),
      'utf8'
    ).includes('\r\n'),
    'dependency cli newlines converted'
  )
  t.end()
})

test('\'npm install\' should not convert newlines to Unix/Linux style in non-hashbang cli files', function (t) {
  t.ok(
    fs.readFileSync(
      path.resolve(pkg, 'node_modules/cli-dependency/nohashbang.js'),
      'utf8'
    ).includes('\r\n'),
    'dependency cli newlines retained'
  )
  t.end()
})

test('cleanup', function (t) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  t.end()
})
