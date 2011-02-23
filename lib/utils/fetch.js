/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("http")
  , https = require("https")
  , url = require("url")
  , sys = require("./sys")
  , fs = require("./graceful-fs")
  , get = require("./get")
  , set = require("./set")
  , log = require("./log")
  , npm = require("../../npm")
  , path = require("path")
  , mkdir = require("./mkdir-p")
  , consts = require("constants")
  , proxyify = require("./proxyify")

module.exports = fetch
function fetch (remote, local, headers, cb) {
  if (typeof cb !== "function") cb = headers, headers = {}
  log.info(remote, "fetch")
  log.verbose(local, "fetch to")
  mkdir(path.dirname(local), function (er) {
    if (er) return cb(er)
    fetch_(remote, local, headers, cb)
  })
}

function fetch_ (remote, local, headers, cb) {
  var fstr = fs.createWriteStream(local, { mode : 0755 })
  fstr.on("error", function (er) {
    fs.close(fstr.fd, function () {})
    if (fstr._ERROR) return
    cb(fstr._ERROR = er)
  })
  fstr.on("open", function () {
    fetchAndWrite(remote, fstr, headers)
  })
  fstr.on("close", function () {
    if (fstr._ERROR) return
    cb()
  })
}

function fetchAndWrite (remote, fstr, headers, maxRedirects, redirects) {
  if (!redirects) redirects = 0
  if (!maxRedirects) maxRedirects = 10
  var remote = url.parse(remote)
    , opts =
      { headers: headers
      , path: (remote.pathname||"/")+(remote.search||"")+(remote.hash||"")
      , host: remote.hostname
      , port: remote.port
      , secure: remote.protocol.toLowerCase() === "https:"
      //FIXME: this sucks.
      , agent: false
      }
  if (!opts.port) opts.port = opts.secure ? 443 : 80

  opts = proxyify(npm.config.get("proxy"), remote, opts)
  if (!opts) return cb(new Error("Bad proxy config: "+npm.config.get("proxy")))

  ;(opts.secure ? https : http).get(opts, function (response) {
    // handle redirects.
    var loc = get(response.headers, "location")

    if (Math.floor(response.statusCode / 100) === 3
        && loc && redirects < maxRedirects) {
      // This is a laughably naïve way to handle this situation.
      // @TODO: Really need a full curl or wget style module that would
      // do all this kind of stuff for us.
      var cookie = get(response.headers, "Set-Cookie")
      if (cookie) {
        cookie = (cookie + "").split(";").shift()
        set(opts.headers, "Cookie", cookie)
      }
      remote = url.parse(loc)

      log.verbose(response.statusCode+" "+loc, "fetch")
      return fetchAndWrite(remote, fstr, headers, maxRedirects, redirects + 1)
    }

    if (response.statusCode !== 200) {
      return fstr.emit("error", new Error(response.statusCode + " " +
                (sys.inspect(response.headers))))
    }

    // this is the one we want.
    response.pipe(fstr)
  }).on("error", function (e) { fstr.emit("error", e) })
}

if (module === require.main) {

log("testing", "fetch")
var exec = require("./exec")
  , urls =
    [ "http://github.com/isaacs/npm/tarball/master"
    , "http://registry.npmjs.org/npm/-/npm-0.2.18.tgz"
    , "http://registry.npmjs.org/less/-/less-1.0.41.tgz"
    , "http://nodejs.org/dist/node-latest.tar.gz"
    ]
  , path = require("path")
  , assert = require("assert")
urls.forEach(function (url) {
  var fetchFile = path.basename(url, ".tgz")+"_fetch.tgz"
    , wgetFile = path.basename(url, ".tgz")+"_wget.tgz"
  fetch(url, fetchFile, function (e) {
    if (e) { log.error(e, fetchFile) ; throw e }
    exec( "wget"
        , ["--no-check-certificate", "-O", wgetFile, url]
        , null, false
        , function (er, code, stdout, stderr) {
            if (e) { log.error(e, wgetFile) ; throw e }
            exec("md5", ["-q", wgetFile], function (er, _, wghash, __) {
              if (e) { log.error(e, "md5 "+wgetFile) ; throw e }
              exec("md5", ["-q", fetchFile], function (er, _, fhash, __) {
                if (e) { log.error(e, "md5 "+fetchFile) ; throw e }
                assert.equal(wghash, fhash, fetchFile + " == " + wgetFile)
              })
            })
          }
        )
  })
})

}
