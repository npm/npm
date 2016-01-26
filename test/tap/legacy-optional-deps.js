'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-optional-deps')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-optional-deps')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var fixture = new Tacks(
  Dir({
    README: File(
      'just an npm test\n'
    ),
    'package.json': File({
      name: 'npm-test-optional-deps',
      version: '1.2.5',
      scripts: {
        test: 'node test.js'
      },
      optionalDependencies: {
        'npm-test-foobarzaaakakaka': 'http://example.com/',
        dnode: '10.999.14234',
        sax: '0.3.5',
        glob: 'some invalid version 99 #! $$ x y z',
        'npm-test-failer': '*'
      }
    }),
    'test.js': File(
      "var fs = require('fs')\n" +
      "var assert = require('assert')\n" +
      "var path = require('path')\n" +
      '\n' +
      '// sax should be the only dep that ends up installed\n' +
      '\n' +
      "var dir = path.resolve(__dirname, 'node_modules')\n" +
      "assert.deepEqual(fs.readdirSync(dir), ['sax'])\n" +
      "assert.equal(require('sax/package.json').version, '0.3.5')\n"
    )
  })
)
test('setup', function (t) {
  setup()
  t.done()
})
test('optional-deps', function (t) {
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
