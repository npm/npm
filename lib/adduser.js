var registry = require('./utils/registry'),
    ini = require("./utils/ini"),
    sys = require("sys"),
    log = require("./utils/log"),
    base64 = require("./utils/base64");

var adduser = function (username, password, email, callback) {  
  if (typeof email === "function") {
    callback = email;
    email = undefined;
  } 
  registry.adduser(username, password, email, function (error) {
    if (!error) {
      config = ini.getConfig();
      config.set('auth', base64.encode(username+':'+password));
      log("Created user "+username+" and configured authentication credentials for npm.")
    } else {
      callback({message:error});
    }
  });
}

module.exports = adduser;