
module.exports = require("./utils/lifecycle").cmd("stop")
module.exports.usage = "npm stop <name>[@<version>] [<name>[@<version>] ...]"
module.exports.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, true, cb)
}