module.exports = exec

var path = require("path")
  , readJson = require("read-package-json")

exec.usage = "npm exec <command> [<options>]"

function exec(args, cb) {
  if (args.length < 1) return cb(exec.usage);

  var command = args[0]
    , cmd = args.pop()
    , pkgdir = process.cwd()

  readJson(path.resolve(pkgdir, "package.json"), function (er, package) {
    if (er) return cb(er)
    run(package, pkgdir, command, cmd, cb)
  })
}

function run(pkg, wd, command, cmd, cb) {
  console.log('run', arguments);
  cb();
}

