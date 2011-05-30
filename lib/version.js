// npm version <newver>

module.exports = version

var exec = require("./utils/exec")
  , readJson = require("./utils/read-json")
  , semver = require("semver")
  , path = require("path")
  , fs = require("./utils/graceful-fs")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , npm = require("../npm")

version.usage = "npm version <newversion>\n(run in package dir)\n"
              + "'npm -v' or 'npm --version' to print npm version "
              + "("+npm.version+")\n"
              + "'npm view <pkg> version' to view a package's "
              + "published version"

function version (args, cb) {
  if (args.length !== 1) return cb(version.usage)
  var newVer = semver.valid(args[0])
  if (!newVer) return cb(version.usage)
  readJson(path.join(process.cwd(), "package.json"), function (er, data) {
    if (er) return log.er(cb, "No package.json found")(er)
    if (data.version === newVer) return cb(new Error("Version not changed"))
    data.version = newVer
    Object.keys(data).forEach(function (k) {
      if (k.charAt(0) === "_") delete data[k]
    })
    readJson.unParsePeople(data)
    fs.stat(path.join(process.cwd(), ".git"), function (er, s) {
      var doGit = !er && s.isDirectory()
      if (!doGit) return write(data, cb)
      else checkGit(data, cb)
    })
  })
}
function checkGit (data, cb) {
  exec( "git", ["status", "--porcelain"], process.env, false
      , function (er, code, stdout, stderr) {
    var lines = stdout.trim().split("\n").filter(function (line) {
      return line.trim() && !line.match(/^\?\? /)
    })
    if (lines.length) return cb(new Error(
      "Git working directory not clean.\n"+lines.join("\n")))
    write(data, function (er) {
      if (er) return cb(er)
      chain
        ( [ exec, "git", ["add","package.json"], process.env, false ]
        , [ exec, "git", ["commit", "-m", "version "+data.version]
          , process.env, false ]
        , [ exec, "git", ["tag", "v"+data.version], process.env, false ]
        , cb )
    })
  })
}
function write (data, cb) {
  fs.writeFile( path.join(process.cwd(), "package.json")
              , new Buffer(JSON.stringify(data, null, 2))
              , cb )
}
