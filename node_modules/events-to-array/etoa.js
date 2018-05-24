module.exports = eventsToArray

var EE = require('events').EventEmitter
function eventsToArray (ee, ignore, map) {
  ignore = ignore || []
  map = map || function (x) { return x }
  var array = []

  ee.emit = (function (orig) {
    return function etoaWrap (ev) {
      if (ignore.indexOf(ev) === -1) {
        var l = arguments.length
        var args = new Array(l)
        // intentionally sparse array
        var swap = []
        for (var i = 0; i < l; i++) {
          var arg = arguments[i]
          args[i] = arguments[i]
          if (arg instanceof EE)
            swap[i] = eventsToArray(arg, ignore, map)
        }
        args = args.map(map)
        args = args.map(function (arg, index) {
          return swap[index] || arg
        })
        array.push(args)
      }

      return orig.apply(this, arguments)
    }
  })(ee.emit)

  return array
}
