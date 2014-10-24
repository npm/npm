// utilities for working with the js-registry site.

module.exports = RegClient

var join = require("path").join
  , fs = require("graceful-fs")

var npmlog
try {
  npmlog = require("npmlog")
}
catch (er) {
  npmlog = { error: noop, warn: noop, info: noop,
             verbose: noop, silly: noop, http: noop,
             pause: noop, resume: noop }
}

function noop () {}

function RegClient (config) {
  this.config = Object.create(config || {})

  this.config.proxy = this.config.proxy || {}
  if (!this.config.proxy.https && this.config.proxy.http) {
    this.config.proxy.https = this.config.proxy.http
  }

  this.config.ssl = this.config.ssl || {}
  if (this.config.ssl.strict === undefined) this.config.ssl.strict = true

  this.config.retry = this.config.retry || {}
  if (!this.config.retry.count) this.config.retry.count = 2
  if (!this.config.retry.factor) this.config.retry.factor = 10
  if (!this.config.retry.minTimeout) this.config.retry.minTimeout = 10000
  if (!this.config.retry.maxTimeout) this.config.retry.maxTimeout = 60000

  this.config.userAgent = this.config.userAgent || "node/" + process.version
  this.config.defaultTag = this.config.defaultTag || "latest"

  this.log = this.config.log || npmlog
  delete this.config.log
}

fs.readdirSync(join(__dirname, "lib")).forEach(function (f) {
  if (!f.match(/\.js$/)) return
  var name = f.replace(/\.js$/, "")
              .replace(/-([a-z])/, function (_, l) { return l.toUpperCase() })
  RegClient.prototype[name] = require(join(__dirname, "lib", f))
})
