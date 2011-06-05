// defaults, types, and shorthands.


var path = require("path")
  , stdio = process.binding("stdio")
  , url = require("url")
  , Stream = require("stream").Stream
  , semver = require("semver")
  , stableFamily = semver.parse(process.version)
  , os = require("os")
  , nopt = require("nopt")
  , log = require("./log")

nopt.typeDefs.semver = { type: semver, validate: validateSemver }
function validateSemver (data, k, val) {
  if (!semver.valid(val)) return false
  data[k] = semver.valid(val)
}
nopt.invalidHandler = function (k, val, type, data) {
  log.warn(k + "=" + JSON.stringify(val), "invalid config")
}

if (!stableFamily || (+stableFamily[2] % 2)) stableFamily = null
else stableFamily = stableFamily[1] + "." + stableFamily[2]

var defaults
Object.defineProperty(exports, "defaults", {get: function () {
  if (defaults) return defaults
  return defaults =
    { argv : []
    , "always-auth" : false

    // Disable bindist publishing for now.  Too problematic.
    // Revisit when we have a less crappy approach, or just make
    // bindist be a thing that only dedicated build-farms will enable.
    , "bin-publish" : false

    , bindist : stableFamily
        && ( stableFamily + "-"
           + "ares" + process.versions.ares + "-"
           + "ev" + process.versions.ev + "-"
           + "openssl" + process.versions.openssl + "-"
           + "v8" + process.versions.v8 + "-"
           + process.platform + "-"
           + (process.arch ? process.arch + "-" : "")
           + os.release() )

      // are there others?
    , browser : process.platform === "darwin" ? "open" : "google-chrome"
    , cache : path.resolve( process.env.HOME || process.env.TMPDIR || "/tmp"
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
    , globalignorefile : path.resolve( process.execPath
                                     , "..", "..", "etc", "npmignore")
    , group : process.env.SUDO_GID || process.getgid()
    , gzipbin : process.env.GZIPBIN || "gzip"
    , ignore: ""
    , "init.version" : "0.0.0"
    , "init.author.name" : ""
    , "init.author.email" : ""
    , "init.author.url" : ""
    , link: false
    , logfd : stdio.stderrFD
    , loglevel : "warn"
    , long : false
    , "node-version" : process.version
    , npaturl : "http://npat.npmjs.org/"
    , npat : false
    , "onload-script" : false
    , outfd : stdio.stdoutFD
    , parseable : false
    , pre: false
    , prefix : path.join(process.execPath, "..", "..")
    , proxy : process.env.HTTP_PROXY || process.env.http_proxy || null
    , "rebuild-bundle" : true
    , registry : "http://registry.npmjs.org/"
    , rollback : true
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
    , username : ""
    , userconfig : process.env.HOME
                 ? path.resolve( process.env.HOME, ".npmrc" )
                 : null
    , userignorefile : process.env.HOME
                     ? path.resolve( process.env.HOME, ".npmignore" )
                     : null
    , version : false
    , viewer: "man"
    , _exit : true
    }
}})

exports.types =
  { argv : NaN
  , "always-auth" : Boolean
  , "bin-publish" : Boolean
  , bindist : [String, null]
  , browser : String
  , cache : path
  , color : ["always", Boolean]
  , depth : Number
  , description : Boolean
  , dev : Boolean
  , editor : path
  , force : Boolean
  , global : Boolean
  , globalconfig : path
  , globalignorefile: path
  , group : [String, Number]
  , gzipbin : String
  , ignore : String
  , "init.version" : semver
  , "init.author.name" : String
  , "init.author.email" : String
  , "init.author.url" : String
  , link: Boolean
  , logfd : [Number, Stream]
  , loglevel : ["silent","win","error","warn","info","verbose","silly"]
  , long : Boolean
  , "node-version" : [false, semver]
  , npaturl : url
  , npat : Boolean
  , "onload-script" : [false, String]
  , outfd : [Number, Stream]
  , parseable : Boolean
  , pre: Boolean
  , prefix: path
  , proxy : url
  , "rebuild-bundle" : Boolean
  , registry : url
  , rollback : Boolean
  , searchopts : String
  , searchexclude: [null, String]
  , shell : path
  , tag : String
  , tar : String
  , tmp : path
  , "unsafe-perm" : Boolean
  , usage : Boolean
  , user : String
  , username : String
  , userconfig : path
  , userignorefile : path
  , version : Boolean
  , viewer: path
  , _exit : Boolean
  }

exports.shorthands =
  { s : ["--loglevel", "silent"]
  , d : ["--loglevel", "info"]
  , dd : ["--loglevel", "verbose"]
  , ddd : ["--loglevel", "silly"]
  , noreg : ["--no-registry"]
  , reg : ["--registry"]
  , "no-reg" : ["--no-registry"]
  , silent : ["--loglevel", "silent"]
  , verbose : ["--loglevel", "verbose"]
  , h : ["--usage"]
  , H : ["--usage"]
  , "?" : ["--usage"]
  , help : ["--usage"]
  , v : ["--version"]
  , f : ["--force"]
  , gangster : ["--force"]
  , gangsta : ["--force"]
  , desc : ["--description"]
  , "no-desc" : ["--no-description"]
  , "local" : ["--no-global"]
  , l : ["--long"]
  , p : ["--parseable"]
  , porcelain : ["--parseable"]
  , g : ["--global"]
  }
