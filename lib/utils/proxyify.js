
module.exports = proxyify

var npm = require("../../npm")
  , url = require("url")
  , log = require("./log")

var proxy
function proxyify (remote, opts) {
  if (proxy === false) return opts
  if (!proxy) {
    var proxyConfig = npm.config.get("proxy")
    if (!proxyConfig) {
      log.verbose(proxyConfig, "no proxy")
      proxy = false
      return opts
    }
    log.verbose(proxyConfig, "proxy config")
    if (!proxyConfig.match(/^https?:\/\//)) {
      proxyConfig = remote.protocol + "//" + proxyConfig
    }
    proxy = url.parse(proxyConfig)
    if (!proxy) {
      log.warn(proxyConfig, "invalid proxy config")
      return null
    }
  }
  if (proxy.auth) {
    opts.headers["proxy-authorization"] =
      "Basic " + (new Buffer(proxy.auth).toString("base64"))

    //TODO: remove debuggery
    var unpw = proxy.auth.split(":")
      , un = unpw.shift()
      , pw = unpw.join(":")
    log.verbose([un, pw?"****":"<no password>"], "proxy auth")
  }
  opts.headers.host = proxy.hostname
  opts.path = url.format(remote)
  opts.secure = proxy.protocol === "https:"

  //TODO: remove debuggery
  var o = {headers:{}}
  for (var i in opts) if (i !== "headers") o[i] = opts[i]
  if (opts.headers) for (var i in opts.headers) o.headers[i] = opts.headers[i]
  if (o.headers.authorization) o.headers.authorization = "<hidden>"
  if (o.headers["proxy-authorization"]) {
    o.headers["proxy-authorization"] = "<hidden>"
  }
  log.verbose(o, "modified opts for proxy")

  return opts
}
