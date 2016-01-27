'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-bundled-git')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-bundled-git')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var fixture = new Tacks(
  Dir({
    README: File(
      'just an npm test\n'
    ),
    'minimatch-expected.json': File({
      name: 'minimatch',
      description: 'a glob matcher in javascript',
      version: '0.2.1',
      repository: {
        type: 'git',
        url: 'git://github.com/isaacs/minimatch.git'
      },
      main: 'minimatch.js',
      scripts: {
        test: 'tap test'
      },
      engines: {
        node: '*'
      },
      dependencies: {
        'lru-cache': '~1.0.5'
      },
      devDependencies: {
        tap: '~0.1.3'
      },
      licenses: [
        {
          type: 'MIT',
          url: 'http://github.com/isaacs/minimatch/raw/master/LICENSE'
        }
      ]
    }),
    'package.json': File({
      name: 'npm-test-bundled-git',
      scripts: {
        test: 'node test.js'
      },
      version: '1.2.5',
      dependencies: {
        glob: 'git://github.com/isaacs/node-glob.git#npm-test'
      },
      bundledDependencies: [
        'glob'
      ]
    }),
    'test.js': File(
      "var a = require('./node_modules/glob/node_modules/minimatch/package.json')\n" +
      "var e = require('./minimatch-expected.json')\n" +
      "var assert = require('assert')\n" +
      'Object.keys(e).forEach(function (key) {\n' +
      '  assert.deepEqual(a[key], e[key], "didn\'t get expected minimatch/package.json")\n' +
      '})\n'
    )
  })
)
test('setup', function (t) {
  setup()
  t.done()
})
test('bundled-git', function (t) {
  common.npm(['install', '--global-style', fixturepath], {cwd: basepath}, installCheckAndTest)
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
