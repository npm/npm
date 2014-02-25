var test = require('tap').test
var npm = require.resolve('../../bin/npm-cli.js')
var node = process.execPath
var common = require('../common-tap.js')

var opts = { cwd: process.cwd() }

test('npm asdf should return exit code 1', function(t) {
  common.run([npm, 'asdf'], t, opts, function (t, _, __, c) {
    t.equal(c, 1, 'exit code should be 1')
    t.end()
  })
})

test('npm help should return exit code 0', function(t) {
  common.run([npm, 'help'], t, opts, function (t, _, __, c) {
    t.equal(c, 0, 'exit code should be 0')
    t.end()
  })
})

test('npm help fadf should return exit code 0', function(t) {
  common.run([npm, 'help', 'fadf'], t, opts, function (t, _, __, c) {
    t.equal(c, 0, 'exit code should be 0')
    t.end()
  })
})
