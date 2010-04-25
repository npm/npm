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

log(sys.inspect(argv), "cli")

// add usage onto any existing help documentation.
npm.commands.help = usage

while (arg = argv.shift()) {
  if (!command && (arg in npm.commands)) command = arg
  else if (!key && arg.charAt(0) === "-") key = arg.replace(/^-+/, '')
  else if (key) {
    conf[key] = arg
    key = null
  } else arglist.push(arg)
}
if (key) conf[key] = true

if (!command) command = "help"

npm.commands[command](arglist, conf, function (er, ok) {
  if (er) {
    log("failed " + er.message)
    throw er
  } else log("ok")
})

function usage () {
  var out = (arg === "help" ? "puts" : "error");
  function p (m) { sys[out](m); return p };
  p("")
  p("Usage: ")
  p("  " + path.basename(module.filename) + " [global options] <command> [command options]")
  p("")
  p("<command>          Method to call on the npm object.")
  p("                   Supported: "+commands)
  p("[command options]  The arguments to pass to the function.");
}
