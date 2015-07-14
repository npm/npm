'use strict'
var test = require('tap').test
var safe = require('../../lib/utils/safe.js')

test('while', function (t) {
  t.plan(4)
  var iter1 = 0
  safe.while(10, function (doMore) { doMore(iter1 < 5) }, function (next) { ++iter1; next() }, function (er) {
    t.error(er, '5 iterations with a 10 iteration limit produces no error')
    t.is(iter1, 5, 'we actually _did_ 5 iterations')
  })
  var iter2 = 0
  safe.while(10, function (doMore) { doMore(iter2 < 15) }, function (next) { ++iter2; next() }, function (er) {
    t.ok(er, '15 iterations with a 10 iteration limit produces an error')
    t.is(iter2, 10, 'we completed our iteration limit number of iterations')
  })
})

test('whileSync', function (t) {
  var ii = 0
  safe.whileSync(10, function () { return ii < 5 }, function () { ++ii })
  t.is(ii, 5, 'we actually _did_ 5 iterations')
  try {
    ii = 0
    safe.whileSync(10, function () { return ii < 15 }, function () { ++ii })
    t.fail('15 iterations with a 10 iteration limit produces an error')
  } catch (ex) {
    t.pass('15 iterations with a 10 iteration limit produces an error')
    t.is(ii, 10, 'we completed our iteration limit number of iterations')
  }
  t.end()
})

test('dezalgo', function (t) {
  t.plan(4)
  var bad1 = false
  safe.dezalgo(function () { bad1 = true })()
  t.is(bad1, false, 'bad1 dezalgoized')
  var bad2 = false
  setTimeout(safe.dezalgo(function () { bad2 = true }), 10)
  t.is(bad2, false, 'bad2 not yet called')
  setTimeout(function () {
    t.is(bad1, true, 'bad1 set')
    t.is(bad2, true, 'bad2 set')
  }, 15)
})

test('defer', function (t) {
  t.plan(2)
  var haveDeferred = false
  var haveRun = false
  safe.defer(function () {
    haveRun = true
    t.is(haveDeferred, true, 'only executed after we have been deferred')
  })
  haveDeferred = true
  t.is(haveRun, false, 'have not execute yet')
})

test('onlyOnce', function (t) {
  t.plan(3)
  var executions = 0
  var todo = safe.onlyOnce(function () {
    t.is(++executions, 1, 'only ran once')
    if (executions === 1) {
      try {
        todo()
        t.fail('did not throw on second run')
        t.fail('# skip')
      } catch (e) {
        t.pass('threw on second run')
        t.is(e.code, 'EMORETHANONCE', 'threw EMORETHANONCE')
      }
    }
  })
  todo()
})

test('once', function (t) {
  t.plan(2)
  var executions = 0
  var todo = safe.once(function () {
    t.is(++executions, 1, 'only ran once')
    if (executions === 1) todo()
  })
  setTimeout(function () {
    t.is(executions, 1, 'still only ran once')
  }, 10)
  todo()
})
