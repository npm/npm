'use strict'
const path = require('path')
const fs = require('fs')
const test = require('tap').test
const mr = require('npm-registry-mock')
const Tacks = require('tacks')
const File = Tacks.File
const Dir = Tacks.Dir
const extend = Object.assign || require('util')._extend
const common = require('../common-tap.js')

const basedir = path.join(__dirname, path.basename(__filename, '.js'))
const testdir = path.join(basedir, 'testdir')
const cachedir = path.join(basedir, 'cache')
const globaldir = path.join(basedir, 'global')
const tmpdir = path.join(basedir, 'tmp')

const conf = {
  cwd: testdir,
  env: extend(extend({}, process.env), {
    npm_config_cache: cachedir,
    npm_config_tmp: tmpdir,
    npm_config_prefix: globaldir,
    npm_config_registry: common.registry,
    npm_config_loglevel: 'warn'
  })
}

let server
const fixture = new Tacks(Dir({
  cache: Dir(),
  global: Dir(),
  tmp: Dir(),
  testdir: Dir({
    'package-lock.json': File({
      name: 'shrinkwrap-requires-ranges',
      version: '1.0.0',
      lockfileVersion: 1,
      requires: true,
      dependencies: {
        async: {
          version: '0.2.10',
          resolved: 'https://registry.npmjs.org/async/-/async-0.2.10.tgz',
          integrity: 'sha1-trvgsGdLnXGXCMo43owjfLUmw9E='
        },
        checker: {
          version: '0.5.1',
          resolved: 'https://registry.npmjs.org/checker/-/checker-0.5.1.tgz',
          integrity: 'sha1-/vZvY9IxrikQ99198pGRKh6V5dc=',
          requires: {
            async: '0.2.10'
          }
        },
        minimist: {
          version: '0.0.5',
          resolved: 'https://registry.npmjs.org/minimist/-/minimist-0.0.5.tgz',
          integrity: 'sha1-16oye87PUY+RBqxrjwA/o7zqhWY='
        },
        optimist: {
          version: '0.6.0',
          resolved: 'https://registry.npmjs.org/optimist/-/optimist-0.6.0.tgz',
          integrity: 'sha1-aUJIJvNAX3nxQub8PZrljU27kgA=',
          requires: {
            minimist: '0.0.5',
            wordwrap: '0.0.2'
          }
        },
        wordwrap: {
          version: '0.0.2',
          resolved: 'https://registry.npmjs.org/wordwrap/-/wordwrap-0.0.2.tgz',
          integrity: 'sha1-t5Zpu0LstAn4PVg8rVLKF+qhZD8='
        }
      }
    }),
    'package.json': File({
      name: 'shrinkwrap-requires-ranges',
      version: '1.0.0',
      dependencies: {
        checker: '^0.5.1',
        optimist: '^0.6.0'
      }
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
  mr({port: common.port, throwOnUnmatched: true}, function (err, s) {
    if (err) throw err
    server = s
    t.done()
  })
})

test('no upgrade', function (t) {
  return common.npm(['install', '--package-lock-only'], conf).spread((code, stdout, stderr) => {
    t.is(code, 0, 'command ran ok')
    t.comment(stdout.trim())
    t.comment(stderr.trim())
    const lock = JSON.parse(fs.readFileSync(testdir + '/package-lock.json'))
    t.isDeeply(lock.dependencies.checker.requires, {async: '0.2.10'}, 'checker requires not changed')
    t.isDeeply(lock.dependencies.optimist.requires, {minimist: '0.0.5', wordwrap: '0.0.2'}, 'optimist requires not changed')
    t.done()
  })
})

test('upgrade on update', function (t) {
  return common.npm(['install', '--package-lock-only', 'checker@0.5.2'], conf).spread((code, stdout, stderr) => {
    t.is(code, 0, 'command ran ok')
    t.comment(stdout.trim())
    t.comment(stderr.trim())
    const lock = JSON.parse(fs.readFileSync(testdir + '/package-lock.json'))
    t.isDeeply(lock.dependencies.checker.requires, {async: '~0.2.9'}, 'checker requires updated to range')
    t.isDeeply(lock.dependencies.optimist.requires, {minimist: '0.0.5', wordwrap: '0.0.2'}, 'optimist requires not changed')
    t.done()
  })
})

test('cleanup', function (t) {
  server.close()
  cleanup()
  t.done()
})

