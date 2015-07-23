'use strict'
var test = require('tap').test
var log = require('npmlog')

// We use requireInject to get a fresh copy of
// the npm singleton each time we require it.
// If we didn't, we'd have shared state between
// these various tests.
var requireInject = require('require-inject')

test('disabled', function (t) {
  t.plan(1)
  var npm = requireInject('../../lib/npm.js', {})
  npm.load({progress: false}, function () {
    t.is(log.progressEnabled, false, 'should be disabled')
  })
})

test('enabled', function (t) {
  t.plan(1)
  var npm = requireInject('../../lib/npm.js', {})
  npm.load({progress: true}, function () {
    t.is(log.progressEnabled, true, 'should be enabled')
  })
})

test('default', function (t) {
  t.plan(1)
  var npm = requireInject('../../lib/npm.js', {})
  npm.load({}, function () {
    t.is(log.progressEnabled, true, 'should be enabled')
  })
})
