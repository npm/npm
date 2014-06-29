module.exports = some

/**
 * short-circuited async Array.prototype.some implementation
 *
 * Serially evaluates a list of values from a JS array or arraylike
 * against an asynchronous predicate, terminating on the first truthy
 * value. If the predicate encounters an error, pass it to the completion
 * callback. Otherwise, pass the truthy value passed by the predicate, or
 * `false` if no truthy value was passed.
 */
function some (array, test, cb) {
  var index  = 0
    , length = array.length

  map()

  function map () {
    if (index >= length) return cb(null, false)

    test(array[index], reduce)
  }

  function reduce (er, value) {
    if (er) return cb(er, false)
    if (value) return cb(null, value)

    index++
    map()
  }
}
