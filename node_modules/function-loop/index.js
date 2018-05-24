module.exports = loop

// this weird little engine is to loop if the cb's keep getting
// called synchronously, since that's faster and makes shallower
// stack traces, but recurse if any of them don't fire this tick

function loop (self, arr, cb, onerr, i) {
  if (!i)
    i = 0

  var running = false
  while (i < arr.length && !running) {
    running = true
    var sync = true
    try {
      var ret = arr[i].call(self, next)
    } catch (er) {
      return onerr.call(self,er)
    }
    if (ret && typeof ret.then === 'function')
      ret.then(next.bind(self, null), onerr.bind(self))
    i++
    sync = false
  }

  function next (er) {
    if (er)
      return onerr.call(self, er)
    else if (!sync)
      return loop(self, arr, cb, onerr, i)
    running = false
  }

  if (i >= arr.length && !running)
    return cb.call(self)
}
