#!/usr/bin/env node

// don't assume that npm is installed in any particular spot, since this
// might conceivably be a bootstrap attempt.
var log = require("./lib/utils/log")

log("ok", "it worked if it ends with")

var fs = require("fs")
  , path = require("path")
  , sys = require("sys")
  // kludge for earlier nodes' lack of absolute module identity
  , npm = require(__dirname+"/npm")
  , ini = require(__dirname+"/lib/utils/ini")

  // supported commands.
  , argv = process.argv.slice(2)
  , arg = ""

  , conf = {}
  , key
  , arglist = []
  , command
  , flagsDone

log(argv, "cli")

while (arg = argv.shift()) {
  if (!command && (npm.commands.hasOwnProperty(arg))) {
    if (key) {
      conf[key] = true
      key = null
    }
    command = arg
  } else if (!flagsDone && arg.substr(0, 2) === "--") {
    if (key) conf[key] = true
    key = arg.substr(2)
    flagsDone = (key === "")
  } else if (key) {
    conf[key] = arg
    key = null
  } else arglist.push(arg)
}
if (key) conf[key] = true
npm.argv = arglist

var vindex = arglist.indexOf("-v")
  , printVersion = vindex !== -1 || conf.version
if (printVersion) {
  sys.puts(npm.version)
  if (vindex !== -1) arglist.splice(vindex, 1)
} else log(npm.version, "version")

process.on("uncaughtException", errorHandler)
process.on("exit", function () { if (!itWorked) log("not ok") })

var itWorked = false

if (!command) {
  if (!printVersion) {
    // npm.commands.help([arglist.join(" ")])
    if (arglist.length) log(arglist, "unknown command")
    sys.error( "What do you want me to do?\n\n"
             + "Usage:\n"
             + "  npm [flags] <command> [args]\n"
             + "Check 'man npm' or 'man npm-help' for more information\n\n"
             + "This is supposed to happen.  "
             )
    process.exit(1)
  } else itWorked = true
} else {
  ini.resolveConfigs(conf, function (er) {
    if (er) return errorHandler(er)
    npm.config.set("root", ini.get("root"))
    npm.commands[command](arglist, errorHandler)
  })
}

function errorHandler (er) {
  if (!er) {
    itWorked = true
    log("ok")
    return
  }
  sys.error("")
  log(er, "!")
  sys.error("")
  log("try running: 'npm help "+command+"'", "failure")
  log("Report this *entire* log at <http://github.com/isaacs/npm/issues>", "failure")
  log("or email it to <npm-@googlegroups.com>", "failure")
  process.exit(1)
}

