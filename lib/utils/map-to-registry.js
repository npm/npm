var url = require("url")

var log = require("npmlog")
  , npa = require("npm-package-arg")

module.exports = mapToRegistry

function mapToRegistry(name, config, cb) {
  var uri
  var scopedRegistry

  // the name itself takes precedence
  var data = npa(name)
  if (data.scope) {
    name = name.replace("/", "%2f")

    var packageScope = "@" + data.scope
    if (!packageScope) return cb(new Error("No scope found in scoped package named " + name))
    log.silly("mapToRegistry", "packageScope", packageScope)

    scopedRegistry = config.get(packageScope + ":registry")
    if (scopedRegistry) {
      log.silly("mapToRegistry", "scopedRegistry (scoped package)", scopedRegistry)
      uri = url.resolve(scopedRegistry, name)
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
      log.silly("mapToRegistry", "scopedRegistry (scope in config)", scopedRegistry)
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

  log.verbose("mapToRegistry", "name", name)
  log.verbose("mapToRegistry", "uri", uri)
  cb(null, uri)
}
