
var log = require("./log")
  , path = require("path")
  , hasSSL = false
  , sslWorks = false
  , semver = require("./semver")

try {
  hasSSL = !!(process.binding("crypto") && require("crypto"))
} catch (ex) {}

//
// TODO: Change this version when node's SSL client can upload properly.
//
if (hasSSL) {
  sslWorks = require("./semver").gt(process.version, "9999.9999.9999-9999")
}

if (!process.execPath) {
  process.execPath = path.join(process.installPrefix, "bin", "node")
}
var stdio = process.binding("stdio")

module.exports =
  { "auto-activate" : "always"
  , "auto-deactivate" : true
  , binroot : path.dirname(process.execPath)
  , browser : "open"
  , color : true
  , description : true
  , dev : false
  , editor : process.env.EDITOR
  , force : false
  , globalconfig : path.join(process.execPath, "..", "..", "etc", "npmrc")
  , gzipbin : process.env.GZIPBIN || "gzip"
  , listopts: ""
  , logfd : stdio.stderrFD
  , loglevel : "info"
  , manroot : path.join(process.execPath, "..", "..", "share", "man")
  , "must-install" : true
  , "node-version" : process.version
  , "onload-script" : false
  , outfd : stdio.stdoutFD
  , proxy : process.env.http_proxy || null
  , prune : undefined // if set to boolean false, then that means "never"
  , "rebuild-bundle" : true
  , recursive : false
  , registry : "http"+(sslWorks ? "s" : "")+"://registry.npmjs.org/"
  , root : path.join(process.execPath, "..", "..", "lib", "node")
  , tag : "latest"
  , tar : process.env.TAR || "tar"
  , tmproot : (process.env.TMPDIR || "/tmp")
  , "update-dependents" : true
  , userconfig : path.join(process.env.HOME, ".npmrc")
  , _exit : true
  }
