
// test whether everything needed is installed

module.exports = exports = checkdeps

var npm = require("../npm.js")
  , output = require("./utils/output.js")
  , log = require("./utils/log.js")
  , ls = npm.commands.ls

checkdeps.usage = "npm checkdeps"

function _missingDeps(data) {
  if (!data.dependencies) return []
  return Object.keys(data.dependencies).map(function (name) {
    var value = data.dependencies[name]
    if (typeof value === "string")
      return name
    var subResult = _missingDeps(value)
    // not an empty array
    if (subResult.length !== 0)
      return [name, subResult]
    return false
  }).filter(function (data) {
    return data !== false
  })
}

function checkdeps(args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  if (args.length) {
    log.warn("checkdeps doesn't take positional args")
  }

  ls([], true, function(err, data){
    if (err) return cb(err, null)
    var result = _missingDeps(data)
    var ok = result.length === 0
    if (silent) return cb(null, ok)
    if (!silent) {
      var resultstr = 'status:'+(ok?'ok':'not ok')
      if (!ok) {
        var objectives = []
        var needsInstall = result.filter(not(Array.isArray))
        if (needsInstall.length)
          objectives.push('to install '+coolJoin(needsInstall))
        var needsFix = result.filter(Array.isArray).map(function(arr) {
          return arr[0]
        })
        if (needsFix.length)
          objectives.push('to fix '+coolJoin(needsFix))
        objectives = objectives.join(' and ')
        resultstr += '\nPlease execute "npm install" '+objectives
      }
      output.write(resultstr, function (er) { cb(er, ok) })
    }
  })
}

function not(func) {
  return function() {
    return !func.apply(this, arguments)
  }
}

function coolJoin(array) {
  if (array.length >= 2) {
    array = array.concat()
    var last = array.pop()
    array.push(array.pop()+' and '+last)
  }
  return array.join(', ')
}
