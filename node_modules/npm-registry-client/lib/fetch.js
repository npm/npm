var assert = require("assert")
  , url = require("url")

var request = require("request")
  , once = require("once")

module.exports = fetch

function fetch (uri, headers, cb) {
  assert(uri, "must pass resource to fetch")
  assert(cb, "must pass callback")

  if (!headers) headers = {}

  cb = once(cb)

  var client = this
  this.attempt(function (operation) {
    makeRequest.call(client, uri, headers, function (er, req) {
      if (er) return cb(er)

      req.on("error", function (err) {
        if (operation.retry(err)) {
          client.log.info("retry", "will retry, error on last attempt: " + err)
        }
      })

      req.on("response", function (res) {
        client.log.http("fetch", res.statusCode, uri)

        // Only retry on 408, 5xx or no `response`.
        var statusCode = res && res.statusCode

        var timeout = statusCode === 408
        if (timeout) er = new Error("request timed out")

        var serverError = statusCode >= 500
        if (serverError) er = new Error("server error " + statusCode)

        if (er && operation.retry(er)) {
          client.log.info("retry", "will retry, error on last attempt: " + er)
          return
        }

        // Work around bug in node v0.10.0 where the CryptoStream
        // gets stuck and never starts reading again.
        res.resume()
        if (process.version === "v0.10.0") unstick(res)

        cb(null, res)
      })
    })
  })
}

function unstick(response) {
  response.resume = function (orig) { return function() {
    var ret = orig.apply(response, arguments)
    if (response.socket.encrypted) response.socket.encrypted.read(0)
    return ret
  }}(response.resume)
}

function makeRequest (remote, headers, cb) {
  var parsed = url.parse(remote)
  this.log.http("fetch", "GET", parsed.href)

  var er = this.authify(this.conf.get("always-auth"), parsed, headers)
  if (er) return cb(er)

  var opts = this.initialize(
    parsed,
    "GET",
    "application/x-tar",
    headers
  )
  // always want to follow redirects for fetch
  opts.followRedirect = true

  cb(null, request(opts))
}
