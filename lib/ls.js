
// show the installed versions of a package

module.exports = exports = ls

var npm = require("../npm")
  , log = require("./utils/log")
  , readInstalled = require("./utils/read-installed")

function ls (args, cb) {
  var showActive = (npm.config.get("show") === "active")
                   || (npm.config.get("active") === true)
  readInstalled(args, function (er, data) {
    for (var pkg in data) for (var ver in data[pkg]) {
      if (showActive && !data[pkg][ver].active) continue
      log(pkg+" "+ver
        + (data[pkg][ver].active ? " \033[33mactive\033[0m" : "")
        , "installed")
    }
  })
}
