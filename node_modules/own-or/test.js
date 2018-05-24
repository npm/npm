var ownOr = require('./')
var assert = require('assert')

var foo = { bar: 'baz' }

assert.equal(ownOr(foo, 'bar', 'boo'), 'baz')
assert.equal(ownOr(foo, 'boo', 'boo'), 'boo')

var bar = Object.create(foo)
bar.bat = 'boo'
assert.equal(ownOr(bar, 'bar', 'boo'), 'boo')
assert.equal(ownOr(bar, 'bat', 'qux'), 'boo')

console.log('TAP version 13\nok\n1..1')
