var path = require('path')
var test = require('tap').test
var i18npm = require('../')({
  verison: '1.0.0',
  path: path.join(__dirname, 'locales/ja'),
  fallbackPath: path.join(__dirname, 'locales/en')
})
var __ = i18npm.__

test('get translated text', function (t) {
  t.equal(__('test'), 'テスト')
  t.end()
})

test('do fallback', function (t) {
  t.equal(__('hello'), 'hello')
  t.end()
})

test('%s is replaced with arg', function (t) {
  t.equal(__('it is %s', 'me'), 'it is me')
  t.end()
})
