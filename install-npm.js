var npm = require("./npm")
  , sys = require("sys")
  , semver = require("./lib/utils/semver")

npm.commands.install(["npm"], function (er) {
  if (er) {
    sys.error("\nFail!\n")
    throw er
  }
  var npmVer = semver.maxSatisfying(Object.keys(npm.get("npm").versions), "")
  npm.commands.activate(["npm", npmVer], function (er, ok) {
    if (er) {
      sys.error("\nFailed to activate\n")
      throw er
    }
    sys.puts("It worked!")
  })
})
