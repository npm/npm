'use strict'
var test = require('tap').test
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var path = require('path')
var common = require('../common-tap.js')

var testdir = path.resolve(__dirname, path.basename(__filename, '.js'))

var fixture = new Tacks(Dir({
  'package.json': File({
    name: 'x',
    version: '1.0.0',
    dependencies: {
      '@blarg/foo': 'file://./bfoo',
      'foo': 'file://./foo'
    }
  }),
  'npm-shrinkwrap.json': File({
    dependencies: {
      '@blarg/foo': {
        version: '1.0.0',
        from: '@blarg/foo@1.0.0'
      },
      'foo': {
        version: '1.0.0',
        from: 'foo'
      }
    }
  })
}))

function setup () {
  fixture.create(testdir)
}

function cleanup () {
  fixture.remove(testdir)
}

test('setup', function (t) {
  cleanup()
  setup()
  t.end()
})

test('missing resolved field', function (t) {
  common.npm(['install'], {registry: 'nope', cwd: testdir}, function (err, code, out, stderr) {
    t.is(err, null, 'No fatal errors running npm')
    t.match(stderr, /Not found : @blarg\/foo/, 'tried to look it up in registry')
    t.done()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
