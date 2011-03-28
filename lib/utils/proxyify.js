// given a proxy url, a remote href, and an option object,
// return a modified option object that goes through the proxy.

module.exports = proxyify

var url = require("url")
  , proxy

function proxyify (proxyConfig, remote, opts) {
  if (proxy === false) return opts

  if (!proxy) {
    if (!proxyConfig) {
      proxy = false
      return opts
    }
    if (!proxyConfig.match(/^https?:\/\//)) {
      proxyConfig = remote.protocol + "//" + proxyConfig
    }
    proxy = url.parse(proxyConfig)
    if (!proxy) return null
  }

  if (proxy.auth) {
    opts.headers["proxy-authorization"] =
      "Basic " + (new Buffer(proxy.auth).toString("base64"))
  }

  if (typeof remote === "string") remote = url.parse(remote)

  opts.headers.host = remote.hostname
  opts.host = proxy.hostname
  opts.port = +(proxy.port ? proxy.port
               :proxy.protocol === "https:" ? 443
               :80)

  if (remote.port &&
      remote.port !== (remote.protocol === "https:" ? 443 : 80)) {
    opts.headers.host = remote.hostname + ":" + remote.port
  }

  if (remote.auth) {
    headers.authorization = (new Buffer(remote.auth).toString("base64"))
    delete remote.href
    delete remote.host
    delete remote.auth
  }

  opts.path = url.format(remote)

  opts.secure = proxy.protocol === "https:"

  return opts
}
