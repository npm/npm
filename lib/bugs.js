
module.exports = bugs

bugs.usage = "npm bugs [<pkgname>]"

var npm = require("./npm.js")
  , registry = npm.registry
  , log = require("npmlog")
  , opener = require("opener")
  , readJson = require("read-package-json")
  , path = require("path")

bugs.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb()
  registry.get("/-/short", 60000, function (er, list) {
    return cb(null, list || [])
  })
}

function bugs (args, cb) {
  if (npm.config.get("global") && !args.length) return cb(bugs.usage)

  if (!args.length) {
    readJson(path.resolve(npm.prefix, "package.json"), function (er, d) {
      if (er) {
        return cb(er.code === "ENOENT" ? new Error("no package.json file found")
                  : er)
      }
      parseAndOpen(false, d, cb)
    })
  } else {
    var n = args[0].split("@").shift()
    registry.get(n + "/latest", 3600, function (er, d) {
      if (er) return cb(er)
      parseAndOpen(true, d, cb)
    })
  }
}

function parseAndOpen (named, data, cb) {
  var url = data.bugs && data.bugs.url
    , repo = data.repository || data.repositories
  
  if (!url && repo) {
    if (Array.isArray(repo)) repo = repo.shift()
    if (repo.hasOwnProperty("url")) repo = repo.url
    log.verbose("repository", repo)
    if (repo && repo.match(/^(https?:\/\/|git(:\/\/|@))github.com/)) {
      url = repo.replace(/^git(@|:\/\/)/, "https://")
          .replace(/^https?:\/\/github.com:/, "https://github.com/")
          .replace(/\.git$/, "")+"/issues"
    }
  }
  if (!url) {
    if (named) url = "https://npmjs.org/package/" + data.name
    else return cb(new Error("no url specified in package.json"))
  }
  opener(url, { command: npm.config.get("browser") }, cb)
}
