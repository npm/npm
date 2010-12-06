
var log = require("./log")
  , path = require("path")
  , hasSSL = false
try {
  hasSSL = !!(process.binding("crypto") && require("crypto"))
} catch (ex) {}

if (!process.execPath) {
  process.execPath = path.join(process.installPrefix, "bin", "node")
}
var stdio = process.binding("stdio")
module.exports =
  { "auto-activate" : "always"
  , "update-dependents" : true
  , "auto-deactivate" : true
  , "tar" : process.env.TAR || "tar"
  , "gzipbin" : process.env.GZIPBIN || "gzip"
  , tag : "latest"
  , proxy : process.env.http_proxy || null
  , root : path.join(process.execPath, "..", "..", "lib", "node")
  , globalconfig : path.join(process.execPath, "..", "..", "etc", "npmrc")
  , userconfig : path.join(process.env.HOME, ".npmrc")
  , binroot : path.dirname(process.execPath)
  , dev : false
  , loglevel : "info"
  , manroot : path.join(process.execPath, "..", "..", "share", "man")
  , editor : process.env.EDITOR
  , tmproot : (process.env.TMPDIR || "/tmp")
  , _exit : true
  // a stream or a file descriptor of a socket
  // a file fd will sorta work too, but not awesomely.
  , logfd : stdio.stderrFD
  , outfd : stdio.stdoutFD
  , color : true
  , recursive : false
  , force : false
  , prune : undefined // if set to boolean false, then that means "never"
  , listopts: ""
  , "must-install" : true
  , "browser" : "open"
  //
  // TODO: Fix when node's SSL client can upload properly.
  // , registry : hasSSL ? "https://registry.npmjs.org/"
  //            : "http://registry.npmjs.org/"
  //
  , registry : "http://registry.npmjs.org/"
  }
