
var log = require("./log")
  , path = require("path")
  , hasSSL = false
  , sslWorks = false
  , semver = require("semver")

try {
  hasSSL = !!(process.binding("crypto") && require("crypto"))
} catch (ex) {}

if (!process.execPath) {
  process.execPath = path.join(process.installPrefix, "bin", "node")
}
var stdio = process.binding("stdio")

module.exports =
  { argv : []
  , "auto-activate" : "always"
  , "auto-deactivate" : true
  , binroot : path.dirname(process.execPath)
  , browser : "open"
  , color : true
  , description : true
  , dev : false
  , dotnpm : ".npm"
  , editor : process.env.EDITOR || "vi"
  , force : false
  , globalconfig : path.join(process.execPath, "..", "..", "etc", "npmrc")
  , group : process.env.SUDO_GID || process.getgid()
  , gzipbin : process.env.GZIPBIN || "gzip"
  , listopts: ""
  , listexclude: null
  , logfd : stdio.stderrFD
  , loglevel : "info"
  , manroot : path.join(process.execPath, "..", "..", "share", "man")
  , "must-install" : true
  , "node-version" : process.version
  , "onload-script" : false
  , outfd : stdio.stdoutFD
  , pre: false
  , proxy : process.env.HTTP_PROXY || process.env.http_proxy || null
  , prune : undefined // if set to boolean false, then that means "never"
  , "rebuild-bundle" : true
  , recursive : false
  , registry : "http://registry.npmjs.org/"
  , rollback : true
  , root : path.join(process.execPath, "..", "..", "lib", "node")
  , tag : "latest"
  , tar : process.env.TAR || "tar"
  , tmproot : (process.env.TMPDIR || "/tmp")
  , "unsafe-perm" : process.platform === "win32"
                  || process.platform === "cygwin"
                  || !( process.getuid && process.setuid
                     && process.getgid && process.setgid )
                  || process.getuid() !== 0
  , "update-dependents" : true
  , usage : false
  , user : "nobody"
  , userconfig : path.join(process.env.HOME, ".npmrc")
  , version : false
  , _exit : true
  }
