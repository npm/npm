
module.exports = adduser

var registry = require('./utils/registry')
  , ini = require("./utils/ini")
  , log = require("./utils/log")
  , base64 = require("./utils/base64")

function adduser (args, cb) {
  var username = args.shift()
    , password = args.shift()
    , email = args.shift()
  if (!username || !password || !email) return cb(new Error(
    "Usage: npm adduser <username> <password> <email>"))
  registry.adduser(username, password, email, function (er) {
    if (er) return cb(er)
    ini.set('auth', base64.encode(username+':'+password))
    ini.set("username", username)
    ini.set("email", email)
    log("Created user " + username
      + " and configured authentication credentials for npm."
      , "adduser")
    log("Remember to clear your shell history!", "adduser")
  });
}
