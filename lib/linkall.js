var npm = require("./npm.js")
  , asyncMap = require("slide").asyncMap
  , readJson = require("./utils/read-json.js")
  , fs = require("graceful-fs")

module.exports = linkall

linkall.usage = "npm linkall (in package dir)"

function linkall (args, cb) {
  fs.readdir(npm.globalDir, function (er, files) {
    if (er) return cb(er)
    files = files.filter(function (f) {
      return f[0] !== "."
    })

    readJson("package.json", function (er, pkg) {
      if (er) return cb(er)

      var deps = Object.keys(pkg.dependencies)
      if (!npm.config.get("production")) {
        deps = deps.concat(Object.keys(pkg.devDependencies))
      }

      asyncMap(files, function (f, cb_) {
        if (deps.indexOf(f) === -1) return cb_()
        npm.commands.link(f, cb_)
      }, cb)
    })
  })
}
