'use strict'
var path = require('path')
var test = require('tap').test
var mr = require('npm-registry-mock')
var Tacks = require('tacks')
var File = Tacks.File
var Symlink = Tacks.Symlink
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

var server
var fixture = new Tacks(Dir({
  cache: Dir(),
  global: Dir(),
  tmp: Dir(),
  testdir: Dir({
    null: Dir({
      null: Symlink('../null'),
      'package.json': File({
        name: 'null',
        version: '1.0.0',
        description: '',
        main: 'index.js',
        scripts: {
          test: 'echo "Error: no test specified" && exit 1'
        },
        keywords: [ ],
        author: 'Rebecca Turner <me@re-becca.org> (http://re-becca.org/)',
        license: 'ISC'
      })
    }),
    'package.json': File({
      name: 'x',
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {
        preinstall: 'mkdir -p node_modules ; ln -sfT ../null node_modules/null'
      },
      dependencies: {
        null: '*'
      },
      keywords: [ ],
      author: 'Rebecca Turner <me@re-becca.org> (http://re-becca.org/)',
      license: 'ISC'
    }),
    'preinstall-early.js': File('')
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
  mr({port: common.port, throwOnUnmatched: true}, function (err, s) {
    if (err) throw err
    server = s
    t.done()
  })
})

test('example', function (t) {
  common.npm(['install'], conf, function (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'command ran ok')
    t.comment(stdout.trim())
    t.comment(stderr.trim())
    // your assertions here
    t.done()
  })
})

test('cleanup', function (t) {
  server.close()
  cleanup()
  t.done()
})

