
module.exports = chain

// steps, cb
// Each step is either:
// [fn, arg, arg, arg] or
// [obj, "method", arg, arg, arg]
// The eventual cb passed to chain is resolved with an array of
// all the results, and/or an error if one was returned.
function chain () /* step, step, ..., cb */ {
  var steps
    , cb
  if (arguments.length === 1 && Array.isArray(arguments[0])) {
    steps = arguments[0]
  } else {
    steps = Array.prototype.slice.call(arguments, 0)
  }
  cb = steps.pop()

  if (typeof(cb) !== "function") {
    throw new Error("Invalid callback: "+typeof(cb))
  }

  ;(function S (step, results) {
    if (!step) return cb(null, results)
    var obj
      , fn
    function callback (er, ok) {
      if (er) return cb(er, results)
      results.push(ok)
      S(steps.shift(), results)
    }
    if (Array.isArray(step)) {
      while (step[0] && !fn) switch (typeof step[0]) {
        case "object" : obj = step.shift(); break
        case "function" : fn = step.shift(); break
        default : fn = obj[step.shift()]; break
      }
      step.push(callback)
    } else fn = step
    if (typeof fn !== "function") throw new Error(
      "Non-function in chain() "+typeof(fn))

    try {
      if (Array.isArray(step)) fn.apply(obj, step)
      else fn(callback)
    } catch (er) {
      cb(er, results)
    }
  })(steps.shift(), [])
}
