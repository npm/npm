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

module.exports = function fetch (remote, local, headers, cb) {
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
  log(remote, "fetch")
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
    .addListener("response", function (response) {
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
        log(response.statusCode, "fetch")
        return fetchAndWrite(loc, fd, headers, maxRedirects, redirects + 1, cb)
      }
      if (response.statusCode !== 200) {
        return cb(new Error(response.statusCode + " " +
                  (sys.inspect(response.headers).replace(/\s+/, ' '))))
      }
      // response.setBodyEncoding("binary")
      var written = 0
      response.addListener("data", function (chunk) {
        // write the chunk...
        log((written += chunk.length) + " bytes", "fetch")
        if (chunk instanceof Buffer) {
          fs.write(fd, chunk, 0, chunk.length, null
                  , function (er) { if (er) cb(er) })
        } else {
          fs.write(fd, chunk, "ascii", null
                  , function (er) { if (er) cb(er) })
        }
      })
      response.addListener("error", cb)
      response.addListener("end", function () {
        log("finished", "fetch")
        fs.close(fd, cb)
      })
    })
    .end()
}
