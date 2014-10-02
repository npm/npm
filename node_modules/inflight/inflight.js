var wrappy = require('wrappy')
var reqs = Object.create(null)
var once = require('once')

module.exports = wrappy(inflight)

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb)
    return null
  } else {
    reqs[key] = [cb]
    return makeres(key)
  }
}

function makeres(key) {
  return once(function RES (error, data) {
    var cbs = reqs[key]
    var len = cbs.length
    for (var i = 0; i < len; i++) {
      cbs[i](error, data)
    }
    if (cbs.length > len) {
      // added more in the interim.
      // de-zalgo, just in case, but don't call again.
      cbs.splice(0, len)
      process.nextTick(RES.bind(this, error, data))
    } else {
      delete reqs[key]
    }
  })
}
