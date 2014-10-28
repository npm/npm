var assert = require("assert")
  , log = require("npmlog")
  , addRemoteGit = require("./add-remote-git.js")
  , hosted = require("hosted-git-info")

module.exports = function maybeHosted (p, cb) {
  assert(typeof p === "string", "must pass package specifier")
  assert(typeof cb === "function", "must pass callback")

  var parsed = hosted.fromUrl(p)
  var nonssh = parsed.git() || parsed.https()
  log.info( "maybeHosted", "Attempting %s from %s", p, nonssh)

  return addRemoteGit(nonssh, true, function (er, data) {
    if (er) {
      log.info("maybeHosted", "Couldn't clone %s", nonssh)
      log.info("maybeHosted", "Now attempting %s from %s", p, parsed.ssh())

      return addRemoteGit(parsed.ssh(), false, function (er, data) {
        if (er) return cb(er)

        success(parsed.ssh(), data)
      })
    }

    success(nonssh, data)
  })

  function success (u, data) {
    data._from = u
    data._fromHosted = true
    return cb(null, data)
  }
}
