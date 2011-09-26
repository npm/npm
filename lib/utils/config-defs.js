// defaults, types, and shorthands.


var path = require("path")
  , stdio = process.binding("stdio")
  , url = require("url")
  , Stream = require("stream").Stream
  , semver = require("semver")
  , stableFamily = semver.parse(process.version)
  , os = require("os")
  , nopt = require("nopt")
  , log = require("./log.js")

nopt.typeDefs.semver = { type: semver, validate: validateSemver }

function validateSemver (data, k, val) {
  if (!semver.valid(val)) return false
  data[k] = semver.valid(val)
}

nopt.invalidHandler = function (k, val, type, data) {
  log.warn(k + "=" + JSON.stringify(val), "invalid config")

  if (Array.isArray(type)) {
    if (type.indexOf(url) !== -1) type = url
    else if (type.indexOf(path) !== -1) type = path
  }

  switch (type) {
    case url:
      log.warn("Must be a full url with 'http://'", "invalid config")
      break
    case path:
      log.warn("Must be a valid filesystem path", "invalid config")
      break
    case Number:
      log.warn("Must be a numeric value", "invalid config")
      break
  }
}

if (!stableFamily || (+stableFamily[2] % 2)) stableFamily = null
else stableFamily = stableFamily[1] + "." + stableFamily[2]

var httpsOk = semver.satisfies(process.version, ">=0.4.9")

var defaults

var temp = process.env.TMPDIR
         || process.env.TMP
         || process.env.TEMP
         || ( process.platform === "win32"
            ? "c:\\windows\\temp"
            : "/tmp" )

var home = ( process.platform === "win32"
           ? process.env.USERPROFILE
           : process.env.HOME ) || temp

Object.defineProperty(exports, "defaults", {get: function () {
  if (defaults) return defaults
  return defaults =
    { "always-auth" : false

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
    , browser : process.platform === "darwin" ? "open"
              : process.platform === "win32" ? "start"
              : "google-chrome"

    , ca : // the npm CA certificate.
      "-----BEGIN CERTIFICATE-----\n"+
      "MIIChzCCAfACCQDauvz/KHp8ejANBgkqhkiG9w0BAQUFADCBhzELMAkGA1UEBhMC\n"+
      "VVMxCzAJBgNVBAgTAkNBMRAwDgYDVQQHEwdPYWtsYW5kMQwwCgYDVQQKEwNucG0x\n"+
      "IjAgBgNVBAsTGW5wbSBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkxDjAMBgNVBAMTBW5w\n"+
      "bUNBMRcwFQYJKoZIhvcNAQkBFghpQGl6cy5tZTAeFw0xMTA5MDUwMTQ3MTdaFw0y\n"+
      "MTA5MDIwMTQ3MTdaMIGHMQswCQYDVQQGEwJVUzELMAkGA1UECBMCQ0ExEDAOBgNV\n"+
      "BAcTB09ha2xhbmQxDDAKBgNVBAoTA25wbTEiMCAGA1UECxMZbnBtIENlcnRpZmlj\n"+
      "YXRlIEF1dGhvcml0eTEOMAwGA1UEAxMFbnBtQ0ExFzAVBgkqhkiG9w0BCQEWCGlA\n"+
      "aXpzLm1lMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDLI4tIqPpRW+ACw9GE\n"+
      "OgBlJZwK5f8nnKCLK629Pv5yJpQKs3DENExAyOgDcyaF0HD0zk8zTp+ZsLaNdKOz\n"+
      "Gn2U181KGprGKAXP6DU6ByOJDWmTlY6+Ad1laYT0m64fERSpHw/hjD3D+iX4aMOl\n"+
      "y0HdbT5m1ZGh6SJz3ZqxavhHLQIDAQABMA0GCSqGSIb3DQEBBQUAA4GBAC4ySDbC\n"+
      "l7W1WpLmtLGEQ/yuMLUf6Jy/vr+CRp4h+UzL+IQpCv8FfxsYE7dhf/bmWTEupBkv\n"+
      "yNL18lipt2jSvR3v6oAHAReotvdjqhxddpe5Holns6EQd1/xEZ7sB1YhQKJtvUrl\n"+
      "ZNufy1Jf1r0ldEGeA+0ISck7s+xSh9rQD2Op\n"+
      "-----END CERTIFICATE-----\n"

    , cache : path.resolve( home || temp
                          , process.platform === "win32"
                            ? "npm-cache" : ".npm")
    , color : process.platform !== "win32"
    , depth: Infinity
    , description : true
    , dev : false
    , editor : process.env.EDITOR ||
             ( process.platform === "win32" ? "notepad" : "vi" )
    , force : false
    , global : false
    , globalconfig : path.resolve(process.execPath, "..", "..", "etc", "npmrc")
    , globalignorefile : path.resolve( process.execPath
                                     , "..", "..", "etc", "npmignore")
    , group : process.env.SUDO_GID || (process.getgid && process.getgid())
    , gzipbin : process.env.GZIPBIN || "gzip"
    , ignore: ""
    , "init.version" : "0.0.0"
    , "init.author.name" : ""
    , "init.author.email" : ""
    , "init.author.url" : ""
    , link: false
    , logfd : stdio.stderrFD
    , loglevel : "warn"
    , logprefix : process.platform !== "win32"
    , long : false
    , message : null
    , "node-version" : process.version
    , npaturl : "http://npat.npmjs.org/"
    , npat : false
    , "onload-script" : false
    , outfd : stdio.stdoutFD
    , parseable : false
    , pre: false
    , prefix : (process.env.DESTDIR || "")
             + (process.env.PREFIX || path.join(process.execPath, "..", ".."))
    , production: false
    , proxy : process.env.HTTP_PROXY || process.env.http_proxy || null
    , "https-proxy" : process.env.HTTPS_PROXY || process.env.https_proxy ||
                      process.env.HTTP_PROXY || process.env.http_proxy || null
    , "rebuild-bundle" : true
    , registry : "http" + (httpsOk ? "s" : "") + "://registry.npmjs.org/"
    , rollback : true
    , save : false
    , searchopts: ""
    , searchexclude: null
    , shell : process.env.SHELL || "bash"
    , "strict-ssl": true
    , tag : "latest"
    , tar : process.env.TAR || "tar"
    , tmp : temp
    , unicode : true
    , "unsafe-perm" : process.platform === "win32"
                    || process.platform === "cygwin"
                    || !( process.getuid && process.setuid
                       && process.getgid && process.setgid )
                    || process.getuid() !== 0
    , usage : false
    , user : "nobody"
    , username : ""
    , userconfig : path.resolve(home, ".npmrc")
    , userignorefile : path.resolve(home, ".npmignore")
    , version : false
    , viewer: process.platform === "win32" ? "browser" : "man"
    , yes: null

    , _exit : true
    }
}})

exports.types =
  { "always-auth" : Boolean
  , "bin-publish" : Boolean
  , bindist : [String, null]
  , browser : String
  , ca: [null, String]
  , cache : path
  , color : ["always", Boolean]
  , depth : Number
  , description : Boolean
  , dev : Boolean
  , editor : String
  , force : Boolean
  , global : Boolean
  , globalconfig : path
  , globalignorefile: path
  , group : [String, Number]
  , gzipbin : String
  , "https-proxy" : [null, url]
  , ignore : String
  , "init.version" : [null, semver]
  , "init.author.name" : String
  , "init.author.email" : String
  , "init.author.url" : ["", url]
  , link: Boolean
  , logfd : [Number, Stream]
  , loglevel : ["silent","win","error","warn","info","verbose","silly"]
  , logprefix : Boolean
  , long : Boolean
  , "node-version" : [null, semver]
  , npaturl : url
  , npat : Boolean
  , "onload-script" : [null, String]
  , outfd : [Number, Stream]
  , parseable : Boolean
  , pre: Boolean
  , prefix: path
  , production: Boolean
  , proxy : [null, url]
  , "rebuild-bundle" : Boolean
  , registry : [null, url]
  , rollback : Boolean
  , save : Boolean
  , searchopts : String
  , searchexclude: [null, String]
  , shell : path
  , "strict-ssl": Boolean
  , tag : String
  , tar : String
  , tmp : path
  , unicode : Boolean
  , "unsafe-perm" : Boolean
  , usage : Boolean
  , user : String
  , username : String
  , userconfig : path
  , userignorefile : path
  , version : Boolean
  , viewer: String
  , yes: [false, null, Boolean]

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
  , m : ["--message"]
  , p : ["--parseable"]
  , porcelain : ["--parseable"]
  , g : ["--global"]
  , S : ["--save"]
  , y : ["--yes"]
  , n : ["--no-yes"]
  }
