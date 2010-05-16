#!/usr/bin/env node

// don't assume that npm is installed in any particular spot, since this
// might conceivably be a bootstrap attempt.
var fs = require("fs")
  , path = require("path")
  , sys = require("sys")
  , path = require("path")
  , npm = require("./npm")

  // supported commands.
  , log = require("./lib/utils/log")
  , argv = process.argv.slice(2)
  , arg = ""

  , conf = {}
  , key
  , arglist = []
  , command
  , flagsDone

log(sys.inspect(argv), "cli")

while (arg = argv.shift()) {
  if (!command && (arg in npm.commands)) {
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
for (var k in conf) npm.config.set(k, conf[k])

if (!command) {
  // npm.commands.help([arglist.join(" ")])
  if (arglist.length) log(arglist, "unknown command")
  sys.error( "Usage:\n"
           + "  npm [flags] <command> [args]\n"
           + "Check 'man npm' or 'man npm-help' for more information"
           )
} else npm.commands[command](arglist, function (er, ok) {
  if (er) {
    sys.error("")
    log(er, "!")
    sys.error("")
    log("try running: 'npm help "+command+"'", "failure")
    log("Report this *entire* log at <http://github.com/isaacs/npm/issues>", "failure")
    log("or email it to <npm-@googlegroups.com>", "failure")
  } else log("ok")
})
