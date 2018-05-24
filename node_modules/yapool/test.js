var assert = require('assert')
var P = require('./index.js')
var a = { a: 1 }
var b = { b: 1 }

var t = require('tap')
t.jobs = 64
process.env.TAP_BUFFER = 1

t.test(function removeFirstItem (t) {
  var p = new P
  p.add(a)
  p.add(b)
  p.remove(a)
  t.equal(p.length, 1)
  t.equal(p.head, p.tail)
  t.equal(p.head.data, b)
  t.end()
})

t.test(function removeTail (t) {
  var p = new P
  p.add(a)
  p.add(b)
  p.remove(b)
  t.equal(p.length, 1)
  t.equal(p.head, p.tail)
  t.equal(p.head.data, a)
  t.end()
})

t.test(function removeAll (t) {
  var p = new P
  p.add(a)
  p.add(b)
  p.remove(a)
  p.remove(b)
  t.equal(p.length, 0)
  t.equal(p.head, p.tail)
  t.equal(p.head, null)
  t.end()
})

t.test(function removeExtra (t) {
  var p = new P
  p.add(a)
  p.add(b)
  p.remove(b)
  p.remove({some: 'thing not in there'})
  p.remove(a)
  p.remove(a)
  p.remove(a)
  p.remove(a)
  t.equal(p.length, 0)
  t.equal(p.head, p.tail)
  t.equal(p.head, null)
  t.end()
})
