/**
 * Fetch an HTTP url to a local file.
 **/

var request = require("request")
  , fs = require("graceful-fs")
  , npm = require("../../npm.js")
  , url = require("url")
  , log = require("./log.js")
  , path = require("path")
  , mkdir = require("./mkdir-p.js")
  , regUrl

module.exports = fetch

function fetch (remote, local, headers, cb) {
  if (typeof cb !== "function") cb = headers, headers = {}
  log.info(remote, "fetch")
  log.verbose(local, "fetch to")
  mkdir(path.dirname(local), function (er) {
    if (er) return cb(er)
    fetch_(remote, local, headers, cb)
  })
}

function fetch_ (remote, local, headers, cb) {
  var fstr = fs.createWriteStream(local, { mode : 0644 })
  fstr.on("error", function (er) {
    fs.close(fstr.fd, function () {})
    if (fstr._ERROR) return
    cb(fstr._ERROR = er)
  })
  fstr.on("open", function () {
    makeRequest(remote, fstr, headers)
  })
  fstr.on("close", function () {
    if (fstr._ERROR) return
    cb()
  })
}

function makeRequest (remote, fstr, headers) {
  remote = url.parse(remote)
  regUrl = regUrl || url.parse(npm.config.get("registry")).host
  if (remote.host === regUrl && npm.config.get("always-auth")) {
    remote.auth = npm.config.get("_auth")
    if (!remote.auth) return fstr.emit("error", new Error(
      "Auth required and none provided. Please run 'npm adduser'"))
  }

  request({ url: remote }).pipe(fstr)
}
