/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("http")
  , url = require("url")
  , sys = require("sys")
  , fs = require("./graceful-fs")
  , get = require("./get")
  , set = require("./set")
  , log = require("./log")
  , npm = require("../../npm")
  , Buffer = require("buffer").Buffer
  , consts

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
  var r = url.parse(remote)
  headers.host = r.hostname + (r.port ? ":"+r.port : "")
  log.verbose(headers, "request headers")
  log.verbose(remote, "remote url")
  fs.open(local, consts.O_CREAT | consts.O_WRONLY | consts.O_TRUNC, 0755,
    function (er, fd) {
      if (er) return cb(new Error(
        "Failed to create "+local+": "+er.message), fd)
      fetchAndWrite(remote, fd, headers, cb)
    }
  )
}

function fetchAndWrite (remote, fd, headers, maxRedirects, redirects, cb) {
  if (!cb) cb = redirects, redirects = 0
  if (!cb) cb = maxRedirects, maxRedirects = 10
  if (!cb) throw new Error("No callback provided")
  remote = url.parse(remote)
  set(headers, "host", remote.hostname + (remote.port ? ":"+remote.port:""))
  remote.path = remote.pathname+(remote.search||"")+(remote.hash||"")
  var proxyConfig = npm.config.get("proxy")
  if (proxyConfig) {
    if (!proxyConfig.match(/^https?:\/\//)) {
      proxyConfig = remote.protocol+"//"+proxyConfig
    }
    var proxy = (proxyConfig) ? url.parse(proxyConfig) : null
    if (!proxy.host) return cb(new Error("Bad proxy config: "+proxyConfig))
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
        return fetchAndWrite(loc, fd, headers, maxRedirects, redirects + 1, cb)
      }
      if (response.statusCode !== 200) {
        return cb(new Error(response.statusCode + " " +
                  (sys.inspect(response.headers).replace(/\s+/, ' '))))
      }
      var written = 0
        , len = response.headers["content-length"]
        , pct = 0
        , lastPct = 0
      log.verbose(len || "unknown", "content-length")
      response.on("data", function (chunk) {
        // write the chunk...
        written += chunk.length
        if (len) {
          pct = written / len * 100
          if (lastPct === 0 || (pct - lastPct > 10)) {
            log.verbose(Math.round(pct)+"%", "downloaded")
            lastPct = pct
          }
        }
        try {
          fs.writeSync(fd, chunk, 0, chunk.length, null)
        } catch (er) {
          return cb(er)
        }
      })
      response.on("error", cb)
      response.on("end", function () {
        log.verbose(remote.href+" - "+written+" bytes", "fetched")
        fs.close(fd, cb)
      })
    })
    .end()
}

if (module === require.main) {

log("testing", "fetch")
var exec = require("./exec")
  , urls =
    [ "http://registry.npmjs.org/npm/-/npm-0.1.16.tgz"
    , "http://registry.npmjs.org/less/-/less-1.0.5.tgz"
    ]
  , path = require("path")
  , assert = require("assert")
urls.forEach(function (url) {
  var fetchFile = path.basename(url, ".tgz")+"-fetch.tgz"
    , wgetFile = path.basename(url, ".tgz")+"-wget.tgz"
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