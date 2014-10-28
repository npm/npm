module.exports = repo

repo.usage = "npm repo <pkgname>"

var npm = require("./npm.js")
  , opener = require("opener")
  , hostedGitInfo = require("hosted-git-info")
  , url_ = require("url")
  , fetchPackageMetadata = require("./fetch-package-metadata.js")
  , mapToRegistry = require("./utils/map-to-registry.js")
  , registry = npm.registry

repo.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb()
  mapToRegistry("/-/short", npm.config, function (er, uri) {
    if (er) return cb(er)

    npm.registry.get(uri, { timeout : 60000 }, function (er, list) {
      return cb(null, list || [])
    })
  })
}

function repo (args, cb) {
  var n = args.length ? args[0] : "."
  fetchPackageMetadata(n, ".", function (er, d) {
    if (er) return cb(er)
    getUrlAndOpen(d, cb)
  })
}

function getUrlAndOpen (d, cb) {
  var r = d.repository
  if (!r) return cb(new Error("no repository"))
  // XXX remove this when npm@v1.3.10 from node 0.10 is deprecated
  // from https://github.com/npm/npm-www/issues/418
  var info = hostedGitInfo.fromUrl(r.url)
  url = info ? info.browse() : unknownHostedUrl(r.url)

  if (!url) return cb(new Error("no repository: could not get url"))

  opener(url, { command: npm.config.get("browser") }, cb)
}

function unknownHostedUrl (url) {
  try {
    var idx = url.indexOf("@")
    if (idx !== -1) {
      url = url.slice(idx+1).replace(/:([^\d]+)/, "/$1")
    }
    url = url_.parse(url)
    var protocol = url.protocol === "https:"
                 ? "https:"
                 : "http:"
    return protocol + "//" + (url.host || "") +
      url.path.replace(/\.git$/, "")
  }
  catch(e) {}
}
