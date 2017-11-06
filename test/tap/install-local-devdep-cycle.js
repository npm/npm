'use strict'
var path = require('path')
var test = require('tap').test
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var extend = Object.assign || require('util')._extend
var common = require('../common-tap.js')

var basedir = path.join(__dirname, path.basename(__filename, '.js'))
var testdir = path.join(basedir, 'testdir')
var cachedir = path.join(basedir, 'cache')
var globaldir = path.join(basedir, 'global')
var tmpdir = path.join(basedir, 'tmp')

var conf = {
  cwd: testdir,
  env: extend({
    npm_config_cache: cachedir,
    npm_config_tmp: tmpdir,
    npm_config_prefix: globaldir,
    npm_config_registry: common.registry,
    npm_config_loglevel: 'warn'
  }, process.env)
}

var fixture = new Tacks(Dir({
  cache: Dir(),
  global: Dir(),
  tmp: Dir(),
  testdir: Dir({
    a: Dir({
      'package.json': File({
        name: 'a',
        version: '1.0.0',
        dependencies: {
          b: 'file:../b',
          pkgc: 'file:../pkgc.tgz'
        }
      })
    }),
    b: Dir({
      'package.json': File({
        name: 'b',
        version: '1.0.0',
        dependencies: {
          pkgc: 'file:../pkgc.tgz'
        },
        devDependencies: {
          a: 'file:../a'
        }
      })
    }),
    'pkgc.tgz': File(new Buffer(
      '1f8b0800ea6bf2590003edcfc10ac2300c06e09dfb14a167a9294b5bf06d' +
      'caa8636eb6a573bb88efeec6443c285e0a22f4bbfc90e4f027daa6b7addb' +
      'c72dc5690cbeca0c1135112c298dc2d77c5035c85a1a22ad0c1940a949a9' +
      '0a30779177a6f162d352e5185237db61f874f76dbf7d02cffc135706c0bd' +
      '3d3b7e001efbb6e1bb7532bb3476c1af432950206737f6ebaa4551144546' +
      '77b8f041b200080000',
      'hex'
    ))
  })
}))

function setup() {
  cleanup()
  fixture.create(basedir)
}

function cleanup() {
  fixture.remove(basedir)
}

test('setup', function (t) {
  setup()
  t.done()
})

test('install in package with dep that has a devdep of self', function (t) {
  common.npm(['install'], {cwd: path.join(testdir, 'b')}, function (er, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'command ran ok')
    t.comment(stdout.trim())
    t.comment(stderr.trim())
    t.done()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
