
module.exports = remotePackages

var registry = require("../registry")
  , containsSingleMatch = require("./contains-single-match")
  , getCompletions = require("./get-completions")

/*
  Looks up remote packages for CLI tab-completion.

  NOTE: If doVersion is true, versions in the form <name>@<version>
        will be completed.

        If doTag is true, tags in the form <name>@<tag> will be
        completed.

        If recurring in true, sequences of multiple packages can be
        completed. i.e. for schemes such as:
        npm <command> <name>[@<version> [<name>[@<version>] ...]
*/
function remotePackages (args, index, doVersion, doTag
                         , recurring, cb) {
  if (recurring || index < 3) {
    var name = (args.length + 1 === index) ? args[args.length - 1] : ""
    if (name === undefined) name = ""
    // use up-to 1 hour stale cache.  not super urgent.
    registry.get("/", null, 3600, function (er, d) {
      if (er) return cb(er)
      var remoteList = Object.keys(d)
      if (remoteList.indexOf(name) === -1 ||
          !containsSingleMatch(name, remoteList)) {
        if ((doVersion || doTag) && name.indexOf('@') !== -1) {
          var pieces = name.split('@')
            , pkgname = pieces[0]
            , lst = []
          if (d[pkgname]) {
            if (doVersion) lst = lst.concat(Object.keys(d[pkgname].versions))
            if (doTag) lst = lst.concat(Object.keys(d[pkgname]["dist-tags"]))
          }
          lst = lst.map(function(e) { return pkgname + '@' + e })
          cb(null, getCompletions(name, lst))
        } else cb(null, getCompletions(name, remoteList))
      }
    })
  }
}
