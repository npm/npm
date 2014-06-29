var assert = require("assert")

var toNerfDart = require("./nerf-dart.js")

module.exports = getCredentialsByURI

function getCredentialsByURI (uri) {
  assert(uri && typeof uri === "string", "registry URL is required")
  var nerfed = toNerfDart(uri)

  var c = {scope : nerfed}

  if (this.get(nerfed + ":_authToken")) {
    c.token = this.get(nerfed + ":_authToken")
    // the bearer token is enough, don't confuse things
    return c
  }

  if (this.get(nerfed + ":_password")) {
    c.password = new Buffer(this.get(nerfed + ":_password"), "base64").toString("utf8")
  }

  if (this.get(nerfed + ":username")) {
    c.username = this.get(nerfed + ":username")
  }

  if (this.get(nerfed + ":email")) {
    c.email = this.get(nerfed + ":email")
  }

  if (c.username && c.password) {
    c.auth = new Buffer(c.username + ":" + c.password).toString("base64")
  }

  return c
}
