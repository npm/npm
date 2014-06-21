var npm = require("./npm.js")
  , mapToRegistry = require("./utils/map-to-registry.js")

module.exports = deprecate

deprecate.usage = "npm deprecate <pkg>[@<version>] <message>"

deprecate.completion = function (opts, cb) {
  // first, get a list of remote packages this user owns.
  // once we have a user account, then don't complete anything.
  if (opts.conf.argv.remain.length > 2) return cb()
  // get the list of packages by user
  var path = "/-/by-user/"
  mapToRegistry(path, npm.config, function (er, uri) {
    if (er) return cb(er)

    var c = npm.config.getCredentialsByURI(uri)
    if (!(c && c.username)) return cb()

    npm.registry.get(uri + c.username, { timeout : 60000 }, function (er, list) {
      if (er) return cb()
      console.error(list)
      return cb(null, list[c.username])
    })
  })
}

function deprecate (args, cb) {
  var pkg = args[0]
    , msg = args[1]
  if (msg === undefined) return cb("Usage: " + deprecate.usage)

  // fetch the data and make sure it exists.
  var pivot = pkg.lastIndexOf("@")
  if (pivot === 0) pivot = pkg.length
  var name = pkg.substr(0, pivot)
    , ver = pkg.substr(pivot + 1)

  mapToRegistry(name, npm.config, next)

  function next (er, uri) {
    if (er) return cb(er)

    npm.registry.deprecate(uri, ver, msg, cb)
  }
}
