// npm view [pkg [pkg ...]]

module.exports = view
view.usage = "npm view [pkg [pkg ...]]"

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
        d[a] = cleanup(data)
        seen()
      })
    })
}
function cleanup (data) {
  Object.keys(data).forEach(function (d) {
    switch (d) {
      case "author":
        data[d] = unparsePerson(data[d])
        break
      case "contributors":
      case "maintainers":
        data[d] = data[d].map(unparsePerson)
        break
      default:
        if (d.charAt(0) === "_") delete data[d]
        else if (typeof data[d] === "object") cleanup(data[d])
    }
  })
  return data
}
function unparsePerson (d) {
  if (typeof d === "string") return d
  return d.name
       + (d.email ? " <"+d.email+">" : "")
       + (d.url ? " ("+d.url+")" : "")
}

function printData (data, cb) {
  Object.keys(data).forEach(function (d) {
    log(d.replace(/\//, '@'), "view")
    process.stdout.write(sys.inspect(data[d],false,5,true))
  })
  process.stdout.write("\n")
  process.stdout.flush()
  setTimeout(cb,100)
}
