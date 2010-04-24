#!/usr/bin/env node

// usage:
// npm [global options] command [command args]

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

var parsed = {}
  , key
  , val
while (arg = argv.shift()) {
  if (arg in npm.commands) {
    command = arg;
    break;
  }
  
}

log(sys.inspect(argv), "cli")

// add usage onto any existing help documentation.
npm.commands.help = usage

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

npm.commands[command].apply(npm.commands, argv.concat(function (er, ok) {
  if (er) {
    log("failed " + er.message);
    throw er;
  } else log("ok");
}));
