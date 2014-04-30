'use strict';

var log = require("npmlog")
  , url = require("url")
  , addRemoteGit = require("./add-remote-git.js")

module.exports = function maybeGithub (p, name, er, cb) {
  var u = "git://github.com/" + p
    , up = url.parse(u)
  log.info("maybeGithub", "Attempting %s from %s", p, u)

  return addRemoteGit(u, up, name, true, function (er2, data) {
    if (er2) {
      var upriv = "git+ssh://git@github.com:" + p
        , uppriv = url.parse(upriv)

      log.info("maybeGithub", "Attempting %s from %s", p, upriv)

      return addRemoteGit(upriv, uppriv, false, name, function (er3, data) {
        if (er3) return cb(er)
        success(upriv, data)
      })
    }
    success(u, data)
  })

  function success (u, data) {
    data._from = u
    data._fromGithub = true
    return cb(null, data)
  }
}
