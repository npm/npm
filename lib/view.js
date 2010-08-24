// npm view [pkg [pkg ...]]

module.exports = view

var registry = require("./utils/registry")
  , ini = require("./utils/ini-parser")
  , log = require("./utils/log")
  , sys = require("sys")

function view (args, cb) {
  if (!args.length) args = ["/"]
  var d = {}
    , c = args.length
  function seen () { if (--c === 0) printData(d, cb) }
  args
    .map(function (a) { return a.replace(/@/, "/") })
    .forEach(function (a) {
      registry.get(a, function (er, data) {
        if (er || (data && data.error)) {
          data = er || (data && data.error)
        }
        d[a] = data
        seen()
      })
    })
}
function printData (data, cb) {
  Object.keys(data).forEach(function (d) {
    log(d.replace(/\//, '@'), "view ")
    process.stdout.write(sys.inspect(data[d]))
    process.stdout.flush()
  })
  cb()
}