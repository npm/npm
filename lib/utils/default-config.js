
var log = require("./log")
  , path = require("path")
  , hasSSL = false
  , sslWorks = false
  , semver = require("semver")
  , stdio = process.binding("stdio")

try {
  hasSSL = !!(process.binding("crypto") && require("crypto"))
} catch (ex) {}


module.exports =
  { argv : []
  , "auto-activate" : "always"
  , "auto-deactivate" : true
    // are there others?
  , browser : process.platform === "darwin" ? "open" : "google-chrome"
  , cache : path.resolve( process.env.HOME
                        , process.platform === "win32"
                          ? "npm-cache" : ".npm")
  , color : true
  , depth: Infinity
  , description : true
  , dev : false
  , editor : process.env.EDITOR || "vi"
  , force : false
  , global : false
  , globalconfig : path.resolve(process.execPath, "..", "..", "etc", "npmrc")
  , group : process.env.SUDO_GID || process.getgid()
  , gzipbin : process.env.GZIPBIN || "gzip"
  , logfd : stdio.stderrFD
  , loglevel : "warn"
  , long : false
  , "must-install" : true
  , "node-version" : process.version
  , "onload-script" : false
  , outfd : stdio.stdoutFD
  , parseable : false
  , pre: false
  , prefix : path.join(process.execPath, "..", "..")
  , proxy : process.env.HTTP_PROXY || process.env.http_proxy || null
  , "rebuild-bundle" : true
  , recursive : false
  , registry : "http://registry.npmjs.org/"
  , searchopts: ""
  , searchexclude: null
  , shell : process.env.SHELL || "bash"
  , tag : "latest"
  , tar : process.env.TAR || "tar"
  , tmp : (process.env.TMPDIR || "/tmp")
  , "unsafe-perm" : process.platform === "win32"
                  || process.platform === "cygwin"
                  || !( process.getuid && process.setuid
                     && process.getgid && process.setgid )
                  || process.getuid() !== 0
  , usage : false
  , user : "nobody"
  , userconfig : path.resolve(process.env.HOME, ".npmrc")
  , version : false
  , _exit : true
  }
