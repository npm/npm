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

while (arg = argv.shift()) {
  if (!command && (arg in npm.commands)) {
    if (key) {
      conf[key] = true
      key = null
    }
    command = arg
  } else if (arg.substr(0, 2) === "--") {
    if (key) conf[key] = true
    key = arg.substr(2)
  } else if (key) {
    conf[key] = arg
    key = null
  } else arglist.push(arg)
}
if (key) conf[key] = true

for (var k in conf) npm.config.set(k, conf[k])

if (!command) npm.commands.help([arglist.join(" ")])
else npm.commands[command](arglist, conf, function (er, ok) {
  if (er) {
    npm.commands.help([command], conf, function () {
      log(er.stack, "failed")
      process.stdout.flush()
      process.stderr.flush()
      throw er
    })
  } else log("ok")
})
