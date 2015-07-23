'use strict'
var test = require('tap').test
var requireInject = require('require-inject')

test('mac + !fs.access', function (t) {
  var isFsAccessAvailable = requireInject('../../lib/install/is-fs-access-available.js', {
    fs: {},
    process: {platform: 'darwin'}
  })
  t.is(isFsAccessAvailable, false, 'not available')
  t.end()
})
test('mac + fs.access', function (t) {
  var isFsAccessAvailable = requireInject('../../lib/install/is-fs-access-available.js', {
    process: {platform: 'darwin'}
  })
  t.is(isFsAccessAvailable, true, 'available')
  t.end()
})
test('windows + !fs.access', function (t) {
  var isFsAccessAvailable = requireInject('../../lib/install/is-fs-access-available.js', {
    fs: {},
    process: {platform: 'win32'}
  })
  t.is(isFsAccessAvailable, false, 'not available')
  t.end()
})
test('windows + fs.access + node 0.10.40', function (t) {
  var isFsAccessAvailable = requireInject('../../lib/install/is-fs-access-available.js', {
    process: {
      platform: 'win32',
      version: '0.10.40'
    }
  })
  t.is(isFsAccessAvailable, false, 'not available')
  t.end()
})
test('windows + fs.access + node 2.4.0', function (t) {
  var isFsAccessAvailable = requireInject('../../lib/install/is-fs-access-available.js', {
    process: {
      platform: 'win32',
      version: '2.4.0'
    }
  })
  t.is(isFsAccessAvailable, true, 'available')
  t.end()
})
