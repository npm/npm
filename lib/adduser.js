
module.exports = adduser

var registry = require('./utils/registry')
  , ini = require("./utils/ini")
  , log = require("./utils/log")
  , base64 = require("./utils/base64")
  , exec = require("./utils/exec")
  , npm = require("../npm")
  , prompt = require("./utils/prompt")
  , promiseChain = require("./utils/promise-chain")
  , crypto

try {
  crypto = process.binding("crypto") && require("crypto")
} catch (ex) {}


function adduser (args, cb) {
  if (!crypto) return cb(new Error(
    "You must compile node with ssl support to use the adduser feature"))

  var u =
      { u : npm.config.get("username")
      , p : npm.config.get("password")
      , e : npm.config.get("email")
      }
    , changed = false

  promiseChain(cb)
    (prompt, ["Username: ", u.u], function (un) {
      changed = u.u !== un
      u.u = un
    })
    (function (cb) {
      if (u.p && !changed) return cb(null, u.p)
      prompt("Password: ", u.p, true, cb)
    }, [], function (pw) { u.p = pw })
    (prompt, ["Email: ", u.e], function (em) { u.e = em })
    (function (cb) {
      if (changed) npm.config.del("auth")
      registry.adduser(u.u, u.p, u.e, function (er) {
        if (er) {
          return cb(er)
        }
        ini.set("username", u.u)
        ini.set("password", u.p)
        ini.set("email", u.e)
        log( "Authorized user " + u.u
           + " and configured authentication credentials for npm."
           , "adduser")
        log("Remember to clear your shell history!", "adduser")
        cb()
      })
    })
    ()
}
