
/*
usage:

asyncMap(myListOfStuff, function (thing, cb) { doSomething(thing, cb) }, cb)
asyncMap(list, function (l, cb) { foo(l, cb) ; bar(l, cb) }, 2, cb)

*/

module.exports = asyncMap

function asyncMap (list, fn, n, cb_) {
  if (typeof n === "function") cb_ = n, n = 1
  if (typeof cb_ !== "function") throw new Error(
    "No callback provided to asyncMap")
  if (!list || !list.length) return cb_(null, [])
  var data = []
    , errState = null
    , l = list.length
    , a = l * n
  function cb (er, d) {
    if (errState) return
    if (arguments.length > 1) data = data.concat(d)
    // see if any new things have been added.
    if (list.length > l) {
      var newList = list.slice(l)
      a += (list.length - l) * n
      l = list.length
      process.nextTick(function () {
        newList.forEach(function (ar) { fn(ar, cb) })
      })
    }
    if (er) {
      if (false === cb_(errState = er, data)) errState = null
    } else if (-- a === 0) cb_(errState, data)
  }
  list.forEach(function (ar) { fn(ar, cb) })
}

