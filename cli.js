#!/usr/bin/env node

// usage:
// npm [global options] command [command args]

// figure out where we're at.
// don't assume that npm is installed in any particular spot, since this
// might conceivably be a bootstrap attempt.
var fs = require("fs"),
  path = require("path"),
  sys = require("sys"),
  path = require("path"),
  npm = require("./npm");

// supported commands.
var commands =
    [ "help"
    , "install"
    , "activate"
    , "ls"
    , "list"
    , "deactivate"
    , "uninstall"
    , "rm"
    , "link"
    , "publish"
    , "tag"
    , "adduser"
    ],
  log = require("./lib/utils/log");

// slice off the "node cli.js" or "node /usr/local/bin/npm" from the argv
var argv = process.argv.slice(2), arg = "";

log(sys.inspect(argv), "cli");

// add usage onto any existing help documentation.
npm.help = (function (h) { return function () {
  usage();
  h && h.apply(npm, arguments);
}})(npm.help);

var globalOption = (function () {
  // state or something goes here.
  return function (arg) {
    usage();
    throw new Error("global options not yet implemented");
  }
})();

var state = "globalOptions", command = "help";
while (arg = argv.shift()) {
  if (commands.indexOf(arg) !== -1) {
    command = arg;
    break;
  } else globalOption(arg);
}

function usage () {
  var out = (arg === "help" ? "puts" : "error");
  function p (m) { sys[out](m); return p };
  p
    ("")
    ("Usage: ")
    ("  " + path.basename(module.filename) + " [global options] <command> [command options]")
    ("")
    ("[global options]   Not yet implemented")
    ("<command>          Method to call on the npm object.")
    ("                   Supported: "+commands)
    ("[command options]  The arguments to pass to the function.");
}

var result = npm[command].apply(npm, argv.concat(function (er, ok) {
  if (er) {
    log("failed " + er.message);
    throw er;
  } else log("ok");
}));
