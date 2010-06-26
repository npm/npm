
var iamroot = (process.getuid() === 0)
  , log = require("./log")
  , path = require("path")
  , hasSSL = false
try {
  crypto = require("crypto")
  hasSSL = true
} catch (ex) {
  crypto = {}
}

log(iamroot, "sudo")

module.exports =
  { "auto-activate" : "always"
  , "auto-deactivate" : true
  , tag : "latest"
  , root : iamroot ? path.join(process.installPrefix, "lib", "node")
         : require.paths[0].indexOf(".npm") !== -1 ? require.paths[1]
         : require.paths.length > 2 ? require.paths[0]
         : process.env.HOME ? path.join(process.env.HOME, '.node_libraries')
         : process.cwd()
  , binroot : path.join(process.installPrefix, "bin")
  , registry : hasSSL ? "https://registry.npmjs.org/"
             : "http://registry.npmjs.org/"
  }
