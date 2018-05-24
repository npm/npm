'use strict'
var tmatch = require('../')
var t = require('tap')

t.test('set', function (t) {
  var obj = { a: 1 }
  var pattern = new Set([obj, 4])
  var a = new Set([1, 2, 3, 4, obj])
  var b = new Set([obj, 2, 4, 3, 1])
  var c = new Set([4, 3, 2, 1, { a: 1 }])

  t.ok(tmatch(a, pattern))
  t.ok(tmatch(b, pattern))
  t.notOk(tmatch(c, pattern))
  t.notOk(tmatch({not: 'a set'}, pattern))

  t.ok(tmatch(a, b))
  t.notOk(tmatch(a, c))
  t.notOk(tmatch(b, c))
  t.ok(tmatch(new Set(), new Set()))
  t.notOk(tmatch(a, Array.from(a)))
  t.end()
})

t.test('map', function (t) {
  var obj = { a: 1 }
  var pattern = new Map([[5, { a: 1 }], [obj, '6']])

  var a = new Map([[1, 2], [3, 4], [5, obj], [ obj, 6 ]])
  var b = new Map([[3, 4], [5, obj], [ obj, 6 ], [1, 2]])
  // values match, but not strictly
  var c = new Map([[3, 4], [5, { a: '1' }], [ obj, 6 ], [1, 2]])
  // keys don't match
  var d = new Map([[3, 4], [5, { a: 1 }], [ { a: 1 }, 6 ], [1, 2]])

  t.ok(tmatch(a, pattern))
  t.ok(tmatch(b, pattern))
  t.ok(tmatch(c, pattern))
  t.notOk(tmatch(d, pattern))
  t.notOk(tmatch({not: 'a map'}, pattern))

  t.ok(tmatch(a, b))
  t.ok(tmatch(a, c))
  t.ok(tmatch(b, c))
  t.ok(tmatch(new Map(), new Map()))
  t.notOk(tmatch(a, Array.from(a)))
  t.notOk(tmatch(a, d))
  t.notOk(tmatch(a, d))
  t.end()
})
