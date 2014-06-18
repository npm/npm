module.exports = stars

stars.usage = "npm stars [username]"

var npm = require("./npm.js")
  , registry = npm.registry
  , log = require("npmlog")
  , mapNameToRegistry = require("./utils/map-name-to-registry.js")

function stars (args, cb) {
  var name = args.length === 1 ? args[0] : npm.config.get("username")
  mapNameToRegistry(name, npm.config, function (er, uri) {
    if (er) return cb(er)

    registry.stars(uri, showstars)
  })

  function showstars (er, data) {
    if (er) {
      return cb(er)
    }

    if (data.rows.length === 0) {
      log.warn('stars', 'user has not starred any packages.')
    } else {
      data.rows.forEach(function(a) {
        console.log(a.value)
      })
    }
    cb()
  }
}
