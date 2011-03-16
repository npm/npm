
module.exports = installedPackages

var containsSingleMatch = require("./contains-single-match")
  , getCompletions = require("./get-completions")
  , readInstalled = require("../read-installed")

/*
  Looks up installed packages for CLI tab-completion.

  NOTE: If doVersion is true, versions in the form <name>@<version>
        will be completed.

        If recurring in true, sequences of multiple packages can be
        completed. i.e. for schemes such as:
        npm <command> <name>[@<version> [<name>[@<version>] ...]
*/
function installedPackages (args, index, doVersion, recurring, cb) {
  if (recurring || index < 3) {
    var name = (args.length + 1 == index) ? args[args.length - 1] : ""
    readInstalled([], function (er, installed) {
      if (er) return cb(er)
      var instList = Object.keys(installed)
      if (instList.indexOf(name) === -1 ||
          !containsSingleMatch(name, instList)) {
        if (doVersion && name.indexOf('@') !== -1) {
          var pieces = name.split('@')
            , nameverList = Object.keys(installed[pieces[0]]).map(function(v) {
              return pieces[0] + '@' + v
            })
          cb(null, getCompletions(name, nameverList))
        } else cb(null, getCompletions(name, instList))
      }
    })
  }
}
