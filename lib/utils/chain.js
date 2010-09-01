
module.exports = chain

// steps, cb
// Each step is either:
// [fn, arg, arg, arg] or
// [obj, "method", arg, arg, arg]
// The eventual cb passed to chain is resolved with an array of
// all the results, and/or an error if one was returned.
function chain () /* step, step, ..., cb */ {
  var steps
    , cb_
  if (arguments.length === 1 && Array.isArray(arguments[0])) {
    steps = arguments[0]
  } else {
    steps = Array.prototype.slice.call(arguments, 0)
  }
  cb_ = steps.pop()

  if (typeof(cb_) !== "function") {
    throw new Error("Invalid callback: "+typeof(cb_))
  }
  var n = 0
    , l = steps.length
    , results = []

  nextStep(cb)

  function cb (er, res) {
    if (er) return cb_(er)
    if (arguments.length > 1 && typeof(arguments[1]) !== "undefined") {
      results = results.concat(res)
    }
    if (++ n === l) {
      return cb_(null, results)
    }
    else nextStep(cb)
  }
  function nextStep (cb) {
    var s = steps[n]
    // skip over falsey members
    if (!s) return cb()
    // simple function
    if (typeof s === "function") return s(cb)
    if (!Array.isArray(s)) throw new Error(
      "Invalid thing in chain: "+s)
    var obj = null
      , fn = s.shift()
    if (typeof fn === "object") {
      // [obj, "method", some, args]
      obj = fn
      fn = obj[s.shift()]
    }
    fn.apply(obj, s.concat(cb))
  }
}
