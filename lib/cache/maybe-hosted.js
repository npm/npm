var assert = require("assert")
  , log = require("npmlog")
  , addRemoteGit = require("./add-remote-git.js")

module.exports = function maybeHosted (p, cb) {
  assert(typeof p === "object", "must pass package specifier")
  assert(typeof cb === "function", "must pass callback")

  log.info( "maybeHosted", "Attempting %s from %s", p.name
          , p.hosted.httpsUrl)

  return addRemoteGit(p.hosted.httpsUrl, true, function (er, data) {
    if (er) {
      log.info( "maybeGithub", "Attempting %s from %s", p.name
              , p.hosted.sshUrl)

      return addRemoteGit(p.hosted.sshUrl, false, function (er, data) {
        if (er) return cb(er)

        success(p.hosted.sshUrl, data)
      })
    }

    success(p.hosted.httpsUrl, data)
  })

  function success (u, data) {
    data._from = u
    data._fromHosted = true
    return cb(null, data)
  }
}
