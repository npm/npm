var url = require("url")

var isOrganized = require("./is-organized.js")
  , log = require("npmlog")

module.exports = mapNameToRegistry

function mapNameToRegistry(name, config, cb) {
  var uri

  if (isOrganized(name)) {
    var org = name.match(/^(@[^@\/]+)\//)[1]
    if (!org) return cb(new Error("No organization found in scoped package name"))
    log.silly("mapNameToRegistry", "org", org)

    var escaped  = name.replace("/", "%2f")
    var orgRegistry = config.get(org + ":registry-base-url")
    if (!orgRegistry) return cb(new Error("no registry URL found for scope " + org))

    uri = url.resolve(orgRegistry, escaped)
  }
  else {
    uri = url.resolve(config.get("registry"), name)
  }

  log.verbose("mapNameToRegistry", "uri", uri)
  cb(null, uri)
}
