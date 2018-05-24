var t = require('tap')
var loop = require('./')
var obj = {}

t.test('basic passing operation', function (t) {
  var i = 0
  loop(obj, [
    function (cb) {
      t.equal(this, obj, 'this is correct 1')
      t.equal(i, 0, '0')
      cb()
      i++
    },
    function () {
      t.equal(this, obj, 'this is correct 2')
      t.equal(i++, 1, '1')
      return Promise.resolve(true)
    },
    function (cb) {
      t.equal(this, obj, 'this is correct 3')
      t.equal(i++, 2, '2')
      setTimeout(cb)
    },
    function (cb) {
      t.equal(this, obj, 'this is correct 4')
      t.equal(i++, 3, '3')
      process.nextTick(cb)
    }
  ], function () {
    t.equal(this, obj, 'this is correct 5')
    t.equal(i++, 4, '4')
    t.end()
  }, function (er) {
    throw er
  })
  t.equal(i, 2, '2, after loop() call')
})

t.test('throws', function (t) {
  loop(obj, [
    function (cb) {
      t.equal(this, obj, 'this is correct')
      throw new Error('foo')
    },
    function () {
      t.fail('should not get here')
    }
  ], function () {
    t.fail('should not get here')
  }, function (er) {
    t.match(er, { message: 'foo' })
    t.end()
  })
})

t.test('all sync', function (t) {
  var i = 0
  loop(obj, [
    function (cb) { t.equal(i++, 0); cb() },
    function (cb) { t.equal(i++, 1); cb() },
    function (cb) { t.equal(i++, 2); cb() },
    function (cb) { t.equal(i++, 3); cb() },
    function (cb) { t.equal(i++, 4); cb() }
  ], function () {
    t.equal(i++, 5)
  }, function (er) {
    throw er
  })
  t.equal(i, 6)
  t.end()
})

t.test('broken promise', function (t) {
  loop(obj, [
    function (cb) {
      t.equal(this, obj, 'this is correct')
      return Promise.reject(new Error('foo'))
    },
    function () {
      t.fail('should not get here')
    }
  ], function () {
    t.fail('should not get here')
  }, function (er) {
    t.equal(this, obj, 'this is correct')
    t.match(er, { message: 'foo' })
    t.end()
  })
})

t.test('cb err', function (t) {
  loop(obj, [
    function (cb) {
      t.equal(this, obj, 'this is correct')
      cb(new Error('foo'))
    },
    function () {
      t.fail('should not get here')
    }
  ], function () {
    t.fail('should not get here')
  }, function (er) {
    t.equal(this, obj, 'this is correct')
    t.match(er, { message: 'foo' })
    t.end()
  })
})
