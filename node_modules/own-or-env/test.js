var assert = require('assert')
var ownOrEnv = require('./')

process.env.OWN_OR_BOOL_TRUE = '1'
process.env.OWN_OR_BOOL_FALSE = '0'
process.env.OWN_OR_STRING = 'foo'

var conf = { t: true, f: false, s: 'bar' }
assert.equal(ownOrEnv(conf, 't', 'OWN_OR_BOOL_FALSE', true), true)
assert.equal(ownOrEnv(conf, 'x', 'OWN_OR_BOOL_FALSE', true), false)
assert.equal(ownOrEnv(conf, 'f', 'OWN_OR_BOOL_TRUE', true), false)
assert.equal(ownOrEnv(conf, 'x', 'OWN_OR_BOOL_TRUE', true), true)
assert.equal(ownOrEnv(conf, 's', 'OWN_OR_STRING'), 'bar')
assert.equal(ownOrEnv(conf, 'x', 'OWN_OR_STRING'), 'foo')

console.log('TAP version 13\nok\n1..1')
