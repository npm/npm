/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("http")
  , url = require("url")
  , sys = require("./sys")
  , fs = require("./graceful-fs")
  , get = require("./get")
  , set = require("./set")
  , log = require("./log")
  , npm = require("../../npm")
  , Buffer = require("buffer").Buffer
  , consts
  , path = require("path")
  , mkdir = require("./mkdir-p")

try {
  consts = require("constants")
} catch (ex) {
  consts = process
}

module.exports = fetch
function fetch (remote, local, headers, cb) {
  if (!cb) cb = headers, headers = {}
  log.info(remote, "fetch")
  log.verbose(local, "fetch to")
  mkdir(path.dirname(local), function (er) {
    if (er) return cb(er)
    fetch_(remote, local, headers, cb)
  })
}

function fetch_ (remote, local, headers, cb) {
  var r = url.parse(remote)
  headers.host = r.hostname + (r.port ? ":"+r.port : "")
  log.verbose(headers, "request headers")
  log.verbose(remote, "remote url")
  var fstr = fs.createWriteStream(local, { mode : 0755 })
  fstr.on("error", function (er) {
    fs.close(fstr.fd, function () {})
    if (fstr._ERROR) return
    cb(fstr._ERROR = er)
  })
  fstr.on("open", function () { fetchAndWrite(remote, fstr, headers) })
  fstr.on("close", function () {
    if (fstr._ERROR) return
    cb()
  })
}

function fetchAndWrite (remote, fstr, headers, maxRedirects, redirects) {
  if (!redirects) redirects = 0
  if (!maxRedirects) maxRedirects = 10
  remote = url.parse(remote)
  set(headers, "host", remote.hostname + (remote.port ? ":"+remote.port:""))
  remote.path = remote.pathname+(remote.search||"")+(remote.hash||"")
  var proxyConfig = npm.config.get("proxy")
  if (proxyConfig) {
    if (!proxyConfig.match(/^https?:\/\//)) {
      proxyConfig = remote.protocol+"//"+proxyConfig
    }
    var proxy = (proxyConfig) ? url.parse(proxyConfig) : null
    if (!proxy.host) return fstr.emit(
      "error", new Error("Bad proxy config: "+proxyConfig))
    if (proxy.auth) {
      headers["proxy-authorization"] =
        "Basic " + (new Buffer(proxy.auth).toString("base64"))
    }
  }
  var https = (proxy || remote).protocol === "https:"
    , port = (proxy || remote).port || (https ? 443 : 80)
    , hostname = (proxy || remote).hostname
    , path = proxy ? remote.href : (remote.pathname||"/")
                                 + (remote.search||"")
                                 + (remote.hash||"")
  http
    .createClient(port, hostname, https)
    .request( "GET", path, headers)
    .on("response", function (response) {
      // handle redirects.
      var loc = get(response.headers, "location")
      if (Math.floor(response.statusCode / 100) === 3
          && loc && loc !== remote.href && redirects < maxRedirects) {
        // This is a laughably naïve way to handle this situation.
        // @TODO: Really need a full curl or wget style module that would
        // do all this kind of stuff for us.
        var cookie = get(response.headers, "Set-Cookie")
        if (cookie) {
          cookie = (cookie + "").split(";").shift()
          set(headers, "Cookie", cookie)
        }
        log.verbose(response.statusCode+" "+loc, "fetch")
        return fetchAndWrite( loc, fstr, headers
                            , maxRedirects, redirects + 1 )
      }
      if (response.statusCode !== 200) {
        return fstr.emit("error", new Error(response.statusCode + " " +
                  (sys.inspect(response.headers).replace(/\s+/, ' '))))
      }
      // this is the one we want.
      sys.pump(response, fstr)
    })
    .end()
}

if (module === require.main) {

log("testing", "fetch")
var exec = require("./exec")
  , urls =
    [ "http://registry.npmjs.org/npm/-/npm-0.2.4-1.tgz"
    , "http://registry.npmjs.org/less/-/less-1.0.36.tgz"
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
        , ["-O", wgetFile, url]
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
