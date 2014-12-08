module.exports = bugs

bugs.usage = "npm bugs <pkgname>"

var npm = require("./npm.js")
  , log = require("npmlog")
  , opener = require("opener")
  , fetchPackageMetadata = require("./fetch-package-metadata.js")
  , mapToRegistry = require("./utils/map-to-registry.js")
  , registry = npm.registry

bugs.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb()
  mapToRegistry("-/short", npm.config, function (er, uri, auth) {
    if (er) return cb(er)

    npm.registry.get(uri, { timeout : 60000, auth : auth }, function (er, list) {
      return cb(null, list || [])
    })
  })
}

function bugs (args, cb) {
  var n = args.length ? args[0] : "."
  fetchPackageMetadata(n, ".", function (er, d) {
    if (er) return cb(er)

    var url = d.bugs && ((typeof d.bugs === "string") ? d.bugs : d.bugs.url)
    if (!url) {
      url = "https://www.npmjs.org/package/" + d.name
    }
    log.silly("bugs", "url", url)
    opener(url, { command: npm.config.get("browser") }, cb)
  })
}
