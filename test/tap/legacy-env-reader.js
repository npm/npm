'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-env-reader')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-env-reader')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var fixture = new Tacks(
  Dir({
    README: File(
      'just an npm test\n'
    ),
    'package.json': File({
      name: 'npm-test-env-reader',
      version: '1.2.3',
      scripts: {
        install: 'node test.js',
        preinstall: 'node test.js',
        preuninstall: 'node test.js',
        postuninstall: 'node test.js',
        test: 'node test.js',
        stop: 'node test.js',
        start: 'node test.js',
        restart: 'node test.js',
        foo: 'node test.js'
      }
    }),
    'test.js': File(
      'var envs = []\n' +
      'for (var e in process.env) {\n' +
      "  if (e.match(/npm|^path$/i)) envs.push(e + '=' + process.env[e])\n" +
      '}\n' +
      'envs.sort(function (a, b) {\n' +
      '  return a === b ? 0 : a > b ? -1 : 1\n' +
      '}).forEach(function (e) {\n' +
      '  console.log(e)\n' +
      '})\n'
    )
  })
)
test('setup', function (t) {
  setup()
  t.done()
})
test('env-reader', function (t) {
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
