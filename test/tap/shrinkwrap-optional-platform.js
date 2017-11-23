'use strict'
var fs = require('fs')
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
  env: extend(extend({}, process.env), {
    npm_config_cache: cachedir,
    npm_config_tmp: tmpdir,
    npm_config_prefix: globaldir,
    npm_config_registry: common.registry,
    npm_config_loglevel: 'warn'
  })
}

var shrinkwrapContents = {
  name: 'shrinkwrap-optional-platform',
  version: '1.0.0',
  lockfileVersion: 1,
  requires: true,
  dependencies: {
    mod1: {
      version: 'file:mod1',
      optional: true,
      requires: {
        mod2: 'file:mod2'
      }
    },
    mod2: {
      version: 'file:mod2',
      optional: true
    }
  }
}

var fixture = new Tacks(Dir({
  cache: Dir(),
  global: Dir(),
  tmp: Dir(),
  testdir: Dir({
    mod1: Dir({
      'package.json': File({
        name: 'mod1',
        version: '1.0.0',
        scripts: {},
        'optionalDependencies': {
          'mod2': 'file:../mod2'
        },
        os: ['nosuchos']
      })
    }),
    mod2: Dir({
      'package.json': File({
        name: 'mod2',
        version: '1.0.0',
        scripts: {},
        os: ['nosuchos']
      })
    }),
    'npm-shrinkwrap.json': File(shrinkwrapContents),
    'package.json': File({
      name: 'shrinkwrap-optional-platform',
      version: '1.0.0',
      optionalDependencies: {
        mod1: 'file:mod1'
      },
      description: 'x',
      repository: 'x',
      license: 'Artistic-2.0'
    })
  })
}))

function setup () {
  cleanup()
  fixture.create(basedir)
}

function cleanup () {
  fixture.remove(basedir)
}

test('setup', function (t) {
  setup()
  t.done()
})

function readJson (file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

test('example', function (t) {
  common.npm(['install'], conf, function (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'install ran ok')
    t.comment(stdout.trim())
    t.comment(stderr.trim())
    t.notMatch(stderr, /Exit status 1/, 'did not try to install opt dep')
    var shrinkwrapPath = path.join(testdir, 'npm-shrinkwrap.json')
    var postinstallContents = readJson(shrinkwrapPath)
    t.deepEqual(postinstallContents, shrinkwrapContents, 'does not remove failed deps from shrinkwrap')
    t.done()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.done()
})
