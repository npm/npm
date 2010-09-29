
/*
usage:

// do something to a list of things
asyncMap(myListOfStuff, function (thing, cb) { doSomething(thing.foo, cb) }, cb)
// do more than one thing to each item
asyncMap(list, fooFn, barFn, cb)
// call a function that needs to go in and call the cb 3 times
asyncMap(list, callsMoreThanOnce, 3, cb)

*/

module.exports = asyncMap

function asyncMap (list) {
  var steps = Array.prototype.slice.call(arguments)
    , list = steps.shift() || []
    , cb_ = steps.pop()
  if (typeof cb_ !== "function") throw new Error(
    "No callback provided to asyncMap")
  if (!Array.isArray(list)) list = [list]
  var n = steps.length
    , data = []
    , errState = null
    , l = list.length
    , a = l * n
  if (!a) return cb_(null, [])
  function cb (er, d) {
    if (errState) return
    if (arguments.length > 1) data = data.concat(d)
    // see if any new things have been added.
    if (list.length > l) {
      var newList = list.slice(l)
      a += (list.length - l) * n
      l = list.length
      process.nextTick(function () {
        newList.forEach(function (ar) {
          steps.forEach(function (fn) { fn(ar, cb) })
        })
      })
    }
    // allow the callback to return boolean "false" to indicate
    // that an error should not tank the process.
    if (er) {
      if (false === cb_(errState = er, data)) errState = null
    } else if (-- a === 0) cb_(errState, data)
  }
  // expect the supplied cb function to be called
  // "n" times for each thing in the array.
  list.forEach(function (ar) {
    steps.forEach(function (fn) { fn(ar, cb) })
  })
}
