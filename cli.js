#!/usr/bin/env node

// usage:
// node cli.js [global options] command [command args]

// only run as main module.
if (module.id !== ".") return;

var npm = require("./npm"),
  sys = require("sys"),
  path = require("path"),
  log = require("./lib/utils").log;

var argv = process.argv, arg = "";
while (argv.shift() !== module.filename);

function p (m) { sys.error("NPM: "+m); return p };

log("cli: "+sys.inspect(process.argv));

var commands = ["help", "install"];
npm.help = (function (h) { return function () {
  h && h.apply(npm, arguments);
  usage();
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

return npm[command].apply(npm, argv);

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
