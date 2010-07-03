
var iamroot = (process.getuid() === 0)
  , log = require("./log")
  , path = require("path")
  , hasSSL = false
try {
  crypto = process.binding("crypto") && require("crypto")
  hasSSL = true
} catch (ex) {
  crypto = {}
}

log(iamroot, "sudo")

module.exports =
  { "auto-activate" : "always"
  , "auto-deactivate" : true
  , tag : "latest"
  , root : path.join(process.execPath, "..", "..", "lib", "node")
  , binroot : path.dirname(process.execPath)
  , registry : hasSSL ? "https://registry.npmjs.org/"
             : "http://registry.npmjs.org/"
  }
