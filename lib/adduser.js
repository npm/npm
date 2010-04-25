var registry = require('./utils/registry')
  , ini = require("./utils/ini")
  , log = require("./utils/log")
  , base64 = require("./utils/base64")

var adduser = function (args, conf, callback) {
  var username = args.shift()
    , password = args.shift()
    , email = args.shift()
  if (typeof email === "function") {
    callback = email
    email = undefined
  }
  registry.adduser(username, password, email, function (error) {
    if (!error) {
      ini.set('auth', base64.encode(username+':'+password))
      log("Created user "+username+" and configured authentication credentials for npm.",
        "adduser")
    } else {
      callback(error)
    }
  });
}

module.exports = adduser
