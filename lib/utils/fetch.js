/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("http")
  , url = require("url")
  , sys = require("sys")
  , fs = require("fs")
  , get = require("./get")
  , set = require("./set")
  , log = require("./log")
  , Buffer = require("buffer").Buffer

module.exports = fetch
function fetch (remote, local, headers, cb) {
  if (!cb) cb = headers, headers = {}
  log(remote+" to "+local, "fetch")
  headers.host = url.parse(remote).hostname
  fs.open(local, process.O_CREAT | process.O_WRONLY | process.O_TRUNC, 0755,
    function (er, fd) {
      if (er) {
        return cb(new Error(
          "Failed to create "+local+": "+er.message, fd))
      }
      fetchAndWrite(remote, fd, headers, cb)
    }
  )
}

function fetchAndWrite (remote, fd, headers, maxRedirects, redirects, cb) {
  if (!cb) cb = redirects, redirects = 0
  if (!cb) cb = maxRedirects, maxRedirects = 10
  if (!cb) throw new Error("No callback provided")
  remote = url.parse(remote)
  set(headers, "host", remote.hostname)
  remote.path = remote.pathname+(remote.search||"")+(remote.hash||"")
  var https = (remote.protocol === "https:")
  http
    .createClient(remote.port || (https ? 443 : 80), remote.hostname, https)
    .request( "GET"
            , (remote.pathname||"/")+(remote.search||"")+(remote.hash||"")
            , headers
            )
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
          cookie = cookie.split(";").shift()
          set(headers, "Cookie", cookie)
        }
        log(response.statusCode+" "+loc, "fetch")
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
      log(len || "unknown", "content-length")
      response.on("data", function (chunk) {
        // write the chunk...
        written += chunk.length
        if (len) {
          pct = written / len * 100
          if (lastPct === 0 || (pct - lastPct > 10)) {
            log(Math.round(pct)+"%", "downloaded")
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
        log("finished", "fetch")
        log(written, "bytes")
        fs.close(fd, cb)
      })
    })
    .end()
}

if (module !== process.mainModule) return

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
    if (e) { log(e, fetchFile) ; throw e }
    exec( "wget"
        , ["-O", wgetFile, url]
        , null, true
        , function (er, code, stdout, stderr) {
            if (e) { log(e, wgetFile) ; throw e }
            exec("md5", ["-q", wgetFile], null, true, function (er, _, wghash, __) {
              if (e) { log(e, "md5 "+wgetFile) ; throw e }
              exec("md5", ["-q", fetchFile], null, true, function (er, _, fhash, __) {
                if (e) { log(e, "md5 "+fetchFile) ; throw e }
                assert.equal(wghash, fhash, fetchFile + " == " + wgetFile)
              })
            })
          }
        )
  })
})
