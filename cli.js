#!/usr/bin/env node

// don't assume that npm is installed in any particular spot, since this
// might conceivably be a bootstrap attempt.
var log = require("./lib/utils/log")
log.waitForConfig()
log.info("ok", "it worked if it ends with")

var fs = require("./lib/utils/graceful-fs")
  , path = require("path")
  , sys = require("sys")
  , npm = require("./npm")
  , ini = require("./lib/utils/ini")
  , rm = require("./lib/utils/rm-rf")

  // supported commands.
  , argv = process.argv.slice(2)
  , arg = ""

  , conf = {}
  , key
  , arglist = []
  , command
  , flagsDone

log.verbose(argv, "cli")

while (arg = argv.shift()) {
  if (!key && (arg === "-h" || arg === "-?")) arg = "--help"
  if (!command && (npm.commands.hasOwnProperty(arg))) {
    if (key) {
      conf[key] = true
      key = null
    }
    command = arg
  } else if (!flagsDone && arg.substr(0, 2) === "--") {
    if (key) conf[key] = true
    key = arg.substr(2)
    if (key === "help") conf[key] = true, key = null
    flagsDone = (key === "")
  } else if (key) {
    if (arg === "false" || arg === "null") arg = JSON.parse(arg)
    else if ( arg === "undefined" ) arg = undefined
    else if (!isNaN(arg)) arg = +arg
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
process.on("exit", function () { if (!itWorked) log.win("not ok") })

var itWorked = false

if (!command && !conf.help) {
  if (!printVersion) {
    // npm.commands.help([arglist.join(" ")])
    if (arglist.length) log.error(arglist, "unknown command")
    sys.error( "What do you want me to do?\n\n"
             + "Usage:\n"
             + "  npm [flags] <command> [args]\n"
             + "Check 'npm help' for more information\n\n"
             )
    process.exit(1)
  } else itWorked = true
} else {
  ini.resolveConfigs(conf, function (er) {
    if (er) return errorHandler(er)
    if (npm.config.get("help") && command !== "help") {
      arglist.unshift(command)
      command = "help"
    }
    npm.config.set("root", ini.get("root"))
    npm.commands[command](arglist, errorHandler)
  })
}

function errorHandler (er) {
  if (!er) {
    itWorked = true
    log.win("ok")
    return rm(npm.tmp, function (er) { process.exit(0) })
  }
  log.error(er)
  if (er.message.trim() === "ECONNREFUSED, Could not contact DNS servers") {
    log.error(["If you are using Cygwin, please set up your /etc/resolv.conf"
              ,"See step 3 in this wiki page:"
              ,"    http://github.com/ry/node/wiki/Building-node.js-on-Cygwin-%28Windows%29"
              ,"If you are not using Cygwin, please report this"
              ,"at <http://github.com/isaacs/npm/issues>"
              ,"or email it to <npm-@googlegroups.com>"
              ].join("\n"))
  } else {
    log.error(["try running: 'npm help "+command+"'"
              ,"Report this *entire* log at <http://github.com/isaacs/npm/issues>"
              ,"or email it to <npm-@googlegroups.com>"
              ].join("\n"))
  }
  rm(npm.tmp, function (er) { process.exit(1) })
}

