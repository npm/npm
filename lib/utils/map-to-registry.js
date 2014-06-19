var url = require("url")

var isScoped = require("./is-scoped.js")
  , log = require("npmlog")

module.exports = mapToRegistry

function mapToRegistry(name, config, cb) {
  var uri
  var scopedRegistry

  // the name itself takes precedence
  var data = isScoped(name)
  if (data) {
    var packageScope = "@" + data.scope
    if (!packageScope) return cb(new Error("No scope found in scoped package named " + name))
    log.silly("mapToRegistry", "packageScope", packageScope)

    var escaped  = name.replace("/", "%2f")
    scopedRegistry = config.get(packageScope + ":registry")
    if (scopedRegistry) {
      uri = url.resolve(scopedRegistry, escaped)
    }
    else {
      log.verbose("mapToRegistry", "no registry URL found for scope", packageScope)
    }
  }

  // ...then --scope=@scope or --scope=scope
  var scope = config.get("scope")
  if (!uri && scope) {
    // I'm an enabler, sorry
    if (scope.charAt(0) !== "@") scope = "@" + scope

    scopedRegistry = config.get(scope + ":registry")
    if (scopedRegistry) {
      uri = url.resolve(scopedRegistry, name)
    }
    else {
      log.verbose("mapToRegistry", "no registry URL found for scope", scope)
    }
  }

  // ...and finally use the default registry
  if (!uri) {
    uri = url.resolve(config.get("registry"), name)
  }

  log.verbose("mapToRegistry", "uri", uri)
  cb(null, uri)
}
