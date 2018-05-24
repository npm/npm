var Deferred = require('./')
var assert = require('assert')
var d = new Deferred()
var t = require('tap')
t.match(d, {
  resolve: Function,
  reject: Function,
  promise: Object
})
