// prune extraneous packages.

module.exports = prune

prune.usage = "npm prune"

var readInstalled = require("./utils/read-installed")
  , npm = require("../npm")

function prune (args, cb) {
  readInstalled(npm.config.get("prefix"), function (er, data) {
    if (er) return cb(er)
    prune_(args, data, cb)
  })
}

function prune_ (args, data, cb) {
  npm.commands.unbuild(prunables(args, data), cb)
}

function prunables (args, data, cb) {
  var deps = data.dependencies || {}
  return Object.keys(deps).map(function (d) {
    if (typeof deps[d] !== "object") return null
    if (deps[d].extraneous
        && (args.length === 0 || args.indexOf(d) !== -1)) {
      return deps[d].path
    }
    return prunables(args, deps[d])
  }).filter(function (d) { return d !== null })
  .reduce(function FLAT (l, r) {
    return l.concat(Array.isArray(r) ? r.reduce(FLAT,[]) : r)
  }, [])
}
