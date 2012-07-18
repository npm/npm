// npm version <newver>

module.exports = version

var exec = require("./utils/exec.js")
  , semver = require("semver")
  , path = require("path")
  , fs = require("graceful-fs")
  , chain = require("slide").chain
  , jsup = require('jsup')
  , log = require("npmlog")
  , npm = require("./npm.js")

version.usage = "npm version [<newversion> | major | minor | patch | build]\n"
              + "\n(run in package dir)\n"
              + "'npm -v' or 'npm --version' to print npm version "
              + "("+npm.version+")\n"
              + "'npm view <pkg> version' to view a package's "
              + "published version\n"
              + "'npm ls' to inspect current package/dependency versions"

function version (args, cb) {
  if (args.length !== 1) return cb(version.usage)
  fs.readFile(path.join(process.cwd(), "package.json"), function (er, data) {
    if (er) {
      log.error("version", "No package.json found")
      return cb(er)
    }

    try {
      data = jsup(data)
    } catch (er) {
      log.error("version", "Bad package.json data")
      return cb(er)
    }

		var newVer = semver.valid(args[0])
    var oldVer = data.get(["version"])
		if (!newVer) newVer = semver.inc(oldVer, args[0])
		if (!newVer) return cb(version.usage)
    if (oldVer === newVer) return cb(new Error("Version not changed"))

    data = data.set(["version"], newVer).stringify()

    fs.stat(path.join(process.cwd(), ".git"), function (er, s) {
      var doGit = !er && s.isDirectory()
      if (!doGit) return write(data, cb)
      else checkGit(data, newVer, cb)
    })
  })
}

function checkGit (data, newVer, cb) {
  exec( npm.config.get("git"), ["status", "--porcelain"], process.env, false
      , function (er, code, stdout, stderr) {
    var lines = stdout.trim().split("\n").filter(function (line) {
      return line.trim() && !line.match(/^\?\? /)
    }).map(function (line) {
      return line.trim()
    })
    if (lines.length) return cb(new Error(
      "Git working directory not clean.\n"+lines.join("\n")))
    write(data, function (er) {
      if (er) return cb(er)
      var message = npm.config.get("message").replace(/%s/g, newVer)
        , sign = npm.config.get("sign-git-tag")
        , flag = sign ? "-sm" : "-am"
      chain
        ( [ [ exec, npm.config.get("git")
            , ["add","package.json"], process.env, false ]
          , [ exec, npm.config.get("git")
            , ["commit", "-m", message ], process.env, false ]
          , [ exec, npm.config.get("git")
            , ["tag", "v"+newVer, flag, message], process.env, false ] ]
        , cb )
    })
  })
}

function write (data, cb) {
  fs.writeFile( path.join(process.cwd(), "package.json")
              , data
              , cb )
}
