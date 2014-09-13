module.exports.getName = getLogFile
module.exports.getLogDir = getLogDir
module.exports.pruneLogs = pruneLogs
module.exports.writeLogFile = writeLogFile
module.exports.logsToRemove = logsToRemove
module.exports.findLogs = findLogs

var path = require("path")
  , rm = require("rimraf")
  , path = require("path")
  , fs = require("graceful-fs") 
  , npm = require("../npm.js")
  , getLogFile = require("./logfile.js")

  
function getLogDir () {
  return path.resolve(path.join(npm.config.get("cache"), "_logs"))
}

function logsToRemove(logs) {
  var lastWeek = new Date().getTime() - 604800000
    , toRemove = []

    if (logs.length > 20) {
      // save newest ten
      logs.sort(function (a, b) { return b.ctime.getTime() - a.ctime.getTime() })
      toRemove = logs.slice(10)
      logs = logs.slice(0, 10)
    }

    logs.forEach(function (s) {
      if (s.ctime.getTime() < lastWeek) toRemove.push(s)
      if (s.size > 10*1024*1024) toRemove.push(s)
    })

    return toRemove
}

function findLogs(dir, cb) {
  fs.readdir(dir, function (er, logfiles) {
    if (er) return cb(er)

    var logs = logfiles.map(function StatEach(f) {
        var n = path.join(getLogDir(), f)
          , s = fs.statSync(n)

        s.name = n;
        return s;
    }).filter(function (s) { return s.isFile() })

    cb(null, logs)
  })
}

function pruneLogs (cb) {
  // deliberately ignoring errors here - cleanup function
  findLogs(getLogDir(), function (er, logs) {
    if (er) return cb ? cb(er) : er
    var toRemove = logsToRemove(log)

    toRemove.forEach(function (s) { rm(s.name, function (er) {
// ? log.info("removed log " + s.name)   
      })
    })
    if (cb) cb()
  })
}

function getLogFile () {
  return path.resolve(getLogDir(), "npm-debug." + process.pid + ".log")
}

function writeLogFile (out, cb) {
  var logFile = getLogFile()
    , tmp = logFile + "." + process.pid

  fs.mkdir(getLogDir(), function (er) {
    if (er) return cb(er)

    fs.writeFile(tmp, out, function (er) {
      if (er) return cb(er)
      fs.rename(tmp, logFile, cb)
    })
  })
}
