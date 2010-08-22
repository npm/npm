
/*
usage:

asyncMap(myListOfStuff, function (thing, cb) { doSomething(thing, cb) }, cb)
asyncMap(list, function (l, cb) { foo(l, cb) ; bar(l, cb) }, 2, cb)

*/

module.exports = asyncMap

function asyncMap (list, fn, n, cb_) {
  if (typeof cb_ !== "function") cb_ = n, n = 1
  if (!list || !list.length) return cb_(null, [])
  var data = []
    , errState = null
    , a = list.length * n
  function cb (er, d) {
    if (errState) return
    if (arguments.length > 1) data = data.concat(d)
    if (er) {
      if (false === cb_(errState = er, data)) errState = null
      return
    }
    if (-- a === 0) return cb_(errState, data)
  }
  list.forEach(function (ar) { fn(ar, cb) })
}

