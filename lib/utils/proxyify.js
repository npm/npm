
module.exports = proxyify

var npm = require("../../npm")
  , url = require("url")

var proxy
function proxyify (remote, opts) {
  if (proxy === false) return opts
  if (!proxy) {
    var proxyConfig = npm.config.get("proxy")
    if (!proxyConfig) {
      proxy = false
      return opts
    }
    if (!proxyConfig.match(/^https?:\/\//)) {
      proxyConfig = remote.protocol + "//" + proxyConfig
    }
    proxy = url.parse(proxyConfig)
    if (!proxy) {
      return null
    }
  }
  if (proxy.auth) {
    opts.headers["proxy-authorization"] =
      "Basic " + (new Buffer(proxy.auth).toString("base64"))
  }
  opts.headers.host = proxy.hostname
  opts.path = url.format(remote)
  opts.secure = proxy.protocol === "https:"
  return opts
}
