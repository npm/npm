var npm = require("./npm.js")

module.exports = whoami

whoami.usage = "npm whoami\n(just prints username according to given registry)"

function whoami (args, silent, cb) {
  // FIXME: need tighter checking on this, but is a breaking change
  if (typeof cb !== "function") {
    cb = silent
    silent = false
  }

  var registry = npm.config.get("registry")
  if (!registry) return cb(new Error("no default registry set"))

  var credentials = npm.config.getCredentialsByURI(registry)
  if (credentials) {
    if (credentials.username) {
      if (!silent) console.log(credentials.username)
      process.nextTick(cb.bind(this, null, credentials.username))
    }
    else if (credentials.token) {
      npm.registry.whoami(registry, function (er, username) {
        if (er) return cb(er)

        if (!silent) console.log(username)
        cb(null, username)
      })
    }
    else {
      process.nextTick(cb.bind(this, new Error("credentials without username or token")))
    }
  }
  else {
    var msg = "Not authed.  Run 'npm adduser'"
    if (!silent) console.log(msg)
      process.nextTick(cb.bind(this, null, msg))
  }
}
