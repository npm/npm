module.exports = docs

docs.usage  = "npm docs <pkgname>"
docs.usage += "\n"
docs.usage += "npm docs ."

var npm = require("./npm.js")
  , opener = require("opener")
  , path = require("path")
  , log = require("npmlog")
  , mapToRegistry = require("./utils/map-to-registry.js")
  , fetchPackageMetadata = require("./fetch-package-metadata.js")

docs.completion = function (opts, cb) {
  mapToRegistry("/-/short", npm.config, function (er, uri, auth) {
    if (er) return cb(er)

    npm.registry.get(uri, { timeout : 60000, auth : auth }, function (er, list) {
      return cb(null, list || [])
    })
  })
}


function docs (args, cb) {
  if (!args || !args.length) args = ["."]
  var pending = args.length
  log.silly("docs",args)
  args.forEach(function(proj) {
    getDoc(proj, function(err) {
      if (err) {
        return cb(err)
      }
      --pending || cb()
    })
  })
}

function getDoc (project, cb) {
  log.silly("getDoc", project)
  fetchPackageMetadata(project, ".", function (er, d) {
    if (er) return cb(er)
    var url = d.homepage
    if (! url) url = "https://npmjs.org/package/" + d.name
    return opener(url, {command: npm.config.get("browser")}, cb)
  })
}
