#!/usr/bin/env node

// usage:
// npm [global options] command [command args]

// only run as main module.
if (module.id !== ".") return;

// supported commands.
var commands = ["help", "install", "activate", "ls", "list"];

var npm = require("npm"),
  sys = require("sys"),
  path = require("path"),
  log = require("npm/utils").log;

var argv = process.argv, arg = "";
while (argv.shift() !== module.filename);

log("cli: "+sys.inspect(process.argv));

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
