
module.exports = errorHandler

var cbCalled = false
  , log = require("./log")
  , npm = require("../../npm")
  , rm = require("./rm-rf")
  , constants = require("constants")
  , itWorked = false
  , path = require("path")

process.on("exit", function (code) {
  if (code) itWorked = false
  if (itWorked) log("ok")
  else {
    if (!cbCalled) {
      log.error("cb() never called!\n ")
    }
    log.error([""
              ,"Additional logging details can be found in:"
              ,"    " + path.resolve("npm-debug.log")
              ].join("\n"))
    log.win("not ok")
  }
  itWorked = false // ready for next exit
})

function errorHandler (er) {
  if (cbCalled) throw new Error("Callback called more than once.")
  cbCalled = true
  if (!er) return exit(0)
  if (!(er instanceof Error)) {
    log.error(er)
    return exit(1)
  }
  if (!er.errno) {
    var m = er.message.match(/^(?:Error: )?(E[A-Z]+)/)
    if (m) {
      m = m[1]
      if (!constants[m] && !npm[m]) constants[m] = {}
      er.errno = npm[m] || constants[m]
    }
  }

  switch (er.errno) {
  case constants.ECONNREFUSED:
    log.error(er)
    log.error(["If you are using Cygwin, please set up your /etc/resolv.conf"
              ,"See step 4 in this wiki page:"
              ,"    http://github.com/ry/node/wiki/Building-node.js-on-Cygwin-%28Windows%29"
              ,"If you are not using Cygwin, please report this"
              ,"at <http://github.com/isaacs/npm/issues>"
              ,"or email it to <npm-@googlegroups.com>"
              ].join("\n"))
    break

  case constants.EACCES:
  case constants.EPERM:
    log.error(er)
    log.error(["",
              "Please use 'sudo' or log in as root to run this command."
              ,""
              ,"    sudo npm "
                +npm.config.get("argv").original.map(JSON.stringify).join(" ")
              ,""
              ,"or set the 'unsafe-perm' config var to true."
              ,""
              ,"    npm config set unsafe-perm true"
              ].join("\n"))
    break

  case npm.ELIFECYCLE:
    log.error(er.message)
    log.error(["","Failed at the "+er.pkgid+" "+er.stage+" script."
              ,"This is most likely a problem with the "+er.pkgname+" package,"
              ,"not with npm itself."
              ,"Tell the author that this fails on your system:"
              ,"    "+er.script
              ,"You can get their info via:"
              ,"    npm owner ls "+er.pkgname
              ,"There is likely additional logging output above."
              ].join("\n"))
    break

  case npm.EJSONPARSE:
    log.error(er.message)
    log.error("File: "+er.file)
    log.error(["Failed to parse package.json data."
              ,"package.json must be actual JSON, not just JavaScript."
              ,"","This is not a bug in npm."
              ,"Tell the package author to fix their package.json file."
              ].join("\n"), "JSON.parse")
    break

  case npm.E404:
    log.error(["'"+er.pkgid+"' is not in the npm registry."
              ,"You should bug the author to publish it."
              ,"Note that you can also install from a tarball or folder."
              ].join("\n"), "404")
    break

  case npm.EPUBLISHCONFLICT:
    log.error(["Cannot publish over existing version."
              ,"Bump the 'version' field, set the --force flag, or"
              ,"    npm unpublish '"+er.pkgid+"'"
              ,"and try again"
              ].join("\n"), "publish fail" )
    break

  case npm.EISGIT:
    log.error([er.message
              ,"    "+er.path
              ,"Refusing to remove it. Update manually,"
              ,"or move it out of the way first."
              ].join("\n"), "git" )
    break

  case npm.ECYCLE:
    log.error([er.message
              ,"While installing: "+er.pkgid
              ,"Found a pathological dependency case that npm cannot solve."
              ,"Please report this to the package author."
              ].join("\n"))
    break

  case npm.EENGINE:
    log.error([er.message
              ,"Not compatible with your version of node/npm: "+er.pkgid
              ,"Required: "+JSON.stringify(er.required)
              ,"Actual:   "
              +JSON.stringify({npm:npm.version
                              ,node:npm.config.get("node-version")})
              ].join("\n"))
    break

  case constants.EEXIST:
    log.error([er.message
              ,"File exists: "+er.path
              ,"Move it away, and try again."].join("\n"))
    break

  default:
    log.error(er)
    log.error(["Report this *entire* log at:"
              ,"    <http://github.com/isaacs/npm/issues>"
              ,"or email it to:"
              ,"    <npm-@googlegroups.com>"
              ].join("\n"))
    break
  }

  var os = require("os")
  log.error("")
  log.error(os.type() + " " + os.release(), "System")
  log.error(process.argv
            .map(JSON.stringify).join(" "), "command")
  exit(typeof er.errno === "number" ? er.errno : 1)
}

function exit (code) {
  var doExit = npm.config.get("_exit")
  log.verbose([code, doExit], "exit")
  if (code) writeLogFile(reallyExit)
  else {
    rm("npm-debug.log", function () { rm(npm.tmp, reallyExit) })
  }
  function reallyExit() {
    itWorked = !code
    if (doExit) process.exit(code || 0)
    else process.emit("exit", code || 0)
  }
}

function writeLogFile (cb) {
  var fs = require("./graceful-fs")
    , fstr = fs.createWriteStream("npm-debug.log")
    , sys = require("util")

  log.history.forEach(function (m) {
    var lvl = log.LEVEL[m.level]
      , pref = m.pref ? " " + m.pref : ""
      , b = lvl + pref + " "
      , msg = typeof m.msg === "string" ? m.msg
            : msg instanceof Error ? msg.stack || msg.message
            : sys.inspect(m.msg, 0, 4)
    fstr.write(new Buffer(b
                         +(msg.split(/\n+/).join("\n"+b))
                         + "\n"))
  })
  fstr.end()
  fstr.on("close", cb)
}
