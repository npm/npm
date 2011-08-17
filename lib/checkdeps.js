
// test whether everything needed is installed

module.exports = exports = checkdeps

var npm = require("../npm.js")
  , output = require("./utils/output.js")
  , log = require("./utils/log.js")
  , ls = npm.commands.ls

checkdeps.usage = "npm checkdeps"

// returns whether something is NOT ok
function _checkdeps(data) {
  if (!data.dependencies) return true
  return Object.keys(data.dependencies).some(function (name) {
    var value = data.dependencies[name]
    if (typeof value === "string")
      return true
    return _checkdeps(value)
  })
}

function checkdeps(args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  if (args.length) {
    log.warn("checkdeps doesn't take positional args")
  }

  ls([], true, function(err, data){
    if (err) return cb(err, null)
    var result = !_checkdeps(data)
    if (silent) return cb(null, result)
    if (!silent) {
      var resultstr = 'status:'+(result?'ok':
              'not ok, use "npm install" to fix it or "npm ls" to see whats going on')
      output.write(resultstr, function (er) { cb(er, result) })
    }
  })
}
