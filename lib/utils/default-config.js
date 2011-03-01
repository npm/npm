
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
  , browser : "open"
  , cache : path.resolve(process.env.HOME,
                         process.env.platform === "win32" ? "npm-cache"
                         : ".npm")
  , color : true
  , description : true
  , dev : false
  , editor : process.env.EDITOR || "vi"
  , force : false
  , global : false
  , globalconfig : path.resolve(process.execPath, "..", "..", "etc", "npmrc")
  , group : process.env.SUDO_GID || process.getgid()
  , gzipbin : process.env.GZIPBIN || "gzip"
  , listopts: ""
  , listexclude: null
  , logfd : stdio.stderrFD
  , loglevel : "info"
  , "must-install" : true
  , "node-version" : process.version
  , "onload-script" : false
  , outfd : stdio.stdoutFD
  , pre: false
  , prefix : path.join(process.execPath, "..", "..")
  , proxy : process.env.HTTP_PROXY || process.env.http_proxy || null
  , prune : undefined // if set to boolean false, then that means "never"
  , "rebuild-bundle" : true
  , recursive : false
  , registry : "http://registry.npmjs.org/"
  , rollback : true
  , tag : "latest"
  , tar : process.env.TAR || "tar"
  , tmp : (process.env.TMPDIR || "/tmp")
  , "unsafe-perm" : process.platform === "win32"
                  || process.platform === "cygwin"
                  || !( process.getuid && process.setuid
                     && process.getgid && process.setgid )
                  || process.getuid() !== 0
  , "update-dependents" : true
  , usage : false
  , user : "nobody"
  , userconfig : path.resolve(process.env.HOME, ".npmrc")
  , version : false
  , _exit : true
  }
