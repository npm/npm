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
  , errorHandler = require("./lib/utils/error-handler")

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
  if (!key && (arg.match(/^-+[h?]$/i))) arg = "--usage"
  if (!command && (npm.commands.hasOwnProperty(arg))) {
    if (key) {
      conf[key] = true
      key = null
    }
    command = arg
  } else if (!flagsDone && arg.substr(0, 2) === "--") {
    if (key) conf[key] = true
    key = arg.substr(2)
    if (key === "usage") conf[key] = true, key = null
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
} else log("npm@"+npm.version, "using")

// make sure that this version of node works with this version of npm.
var semver = require("./lib/utils/semver")
  , nodeVer = process.version
  , reqVer = npm.nodeVersionRequired
if (!semver.satisfies(nodeVer, reqVer)) {
  var badNodeVersion = new Error(
    "npm doesn't work with node " + nodeVer + "\nRequired: node@" + reqVer)
  throw badNodeVersion
}

process.on("uncaughtException", errorHandler)

if (!command && !printVersion) conf.usage = true

if (printVersion) itWorked = true
else {
  if (conf.usage && command !== "help") {
    arglist.unshift(command)
    command = "help"
  }
  ini.resolveConfigs(conf, function (er) {
    if (er) return errorHandler(er)
    npm.config.set("root", ini.get("root"))
    npm.commands[command](arglist, errorHandler)
  })
}
