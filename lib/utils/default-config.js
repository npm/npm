
var log = require("./log")
  , path = require("path")
  , hasSSL = false
try {
  hasSSL = !!(process.binding("crypto") && require("crypto"))
} catch (ex) {}

if (!process.execPath) {
  process.execPath = path.join(process.installPrefix, "bin", "node")
}

module.exports =
  { "auto-activate" : "always"
  , "update-dependents" : true
  , "auto-deactivate" : true
  , tag : "latest"
  , root : path.join(process.execPath, "..", "..", "lib", "node")
  , globalconfig : path.join(process.execPath, "..", "..", "etc", "npmrc")
  , userconfig : path.join(process.env.HOME, ".npmrc")
  , binroot : path.dirname(process.execPath)
  , dev : false

  //
  // TODO: Fix when node's SSL client can upload properly.
  // , registry : hasSSL ? "https://registry.npmjs.org/"
  //            : "http://registry.npmjs.org/"
  //
  , registry : "http://registry.npmjs.org/"
  }
