'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-missing-bindir')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-missing-bindir')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var fixture = new Tacks(
  Dir({
    README: File(
      'just an npm test\n'
    ),
    'package.json': File({
      name: 'npm-test-missing-bindir',
      version: '0.0.0',
      scripts: {
        test: 'node test.js'
      },
      directories: {
        bin: './not-found'
      }
    }),
    'test.js': File(
      "var assert = require('assert')\n" +
      "assert.equal(undefined, process.env.npm_config__password, 'password exposed!')\n" +
      "assert.equal(undefined, process.env.npm_config__auth, 'auth exposed!')\n" +
      "assert.equal(undefined, process.env.npm_config__authCrypt, 'authCrypt exposed!')\n"
    )
  })
)
test('setup', function (t) {
  setup()
  t.done()
})
test('missing-bindir', function (t) {
  common.npm(['install', fixturepath], {cwd: basepath}, installCheckAndTest)
  function installCheckAndTest (err, code, stdout, stderr) {
    if (err) throw err
    console.error(stderr)
    console.log(stdout)
    t.is(code, 0, 'install went ok')
    common.npm(['test'], {cwd: installedpath}, testCheckAndRemove)
  }
  function testCheckAndRemove (err, code, stdout, stderr) {
    if (err) throw err
    console.error(stderr)
    console.log(stdout)
    t.is(code, 0, 'test went ok')
    common.npm(['rm', fixturepath], {cwd: basepath}, removeCheckAndDone)
  }
  function removeCheckAndDone (err, code, stdout, stderr) {
    if (err) throw err
    console.error(stderr)
    console.log(stdout)
    t.is(code, 0, 'remove went ok')
    t.done()
  }
})
test('cleanup', function (t) {
  cleanup()
  t.done()
})
function setup () {
  cleanup()
  fixture.create(fixturepath)
  mkdirp.sync(modulepath)
}
function cleanup () {
  fixture.remove(fixturepath)
  rimraf.sync(basepath)
}
