module.exports = exec

var path = require("path")
  , pkgexec = require('./utils/pkgexec')
  , chain = require("slide").chain
  , log = require("npmlog")
  , readJson = require("read-package-json")

exec.usage = "npm exec <command> [<options>]"

function exec(args, cb) {
  if (args.length < 1) return cb(exec.usage);

  var command = args[0]
    , cmd = args.slice(1)
    , wd = process.cwd()

  log.verbose("exec ", command)

  chain([
    [readJson, path.resolve(wd, "package.json")]
  , [pkgexec, command, cmd, chain.last, wd]
  ], cb)
}
