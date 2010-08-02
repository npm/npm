
var log = require("./log")
  , path = require("path")
  , hasSSL = false
try {
  crypto = process.binding("crypto") && require("crypto")
  hasSSL = true
} catch (ex) {
  crypto = {}
}

if (!process.execPath) {
  process.execPath = path.join(process.installPrefix, "bin", "node")
}

module.exports =
  { "auto-activate" : "always"
  , "auto-deactivate" : true
  , tag : "latest"
  , configFile : path.join(process.execPath, "..", "..", "etc", "npmrc")
  , root : path.join(process.execPath, "..", "..", "lib", "node")
  , binroot : path.dirname(process.execPath)

  //
  // TODO: Fix when node's SSL client can upload properly.
  // , registry : hasSSL ? "https://registry.npmjs.org/"
  //            : "http://registry.npmjs.org/"
  //
  , registry : "http://registry.npmjs.org/"
  }
