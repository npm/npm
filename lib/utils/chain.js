
module.exports = chain;

var method = require(__dirname).method;

// steps, cb
// Each step is either:
// [fn, arg, arg, arg] or
// [obj, "method", arg, arg, arg]
// The eventual cb passed to chain is resolved with an array of
// all the results, and/or an error if one was returned.
function chain () /* step, step, ..., cb */ {
  var steps = Array.prototype.slice.call(arguments, 0),
    cb = steps.pop();

  if (typeof(cb) !== "function") {
    throw new Error("Invalid callback: "+typeof(cb) + " " +sys.inspect(cb));
  }
  
  (function S (step, results) {
    if (!step) return cb(null, results);
    var fn = ( typeof step[0] === "object" )
      ? method(step.shift(), step.shift())
      : step.shift();
    step.push(function (er, ok) {
      if (er) cb(er, results);
      else {
        results.push(ok);
        S(steps.shift(), results);
      }
    });
    try {
      fn.apply(null, step);
    } catch (er) {
      cb(er, results);
    }
  })(steps.shift(), []);
}
