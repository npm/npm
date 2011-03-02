
module.exports = errorHandler

var cbCalled = false
  , log = require("./log")
  , npm = require("../../npm")
  , rm = require("./rm-rf")
  , constants
  , itWorked = false

try { constants = require("constants") }
catch (ex) { constants = process }

process.on("exit", function (code) {
  if (code) itWorked = false
  log.win(itWorked ? "ok" : "not ok")
  itWorked = false // ready for next exit
})

function errorHandler (er) {
  if (cbCalled) throw new Error("Callback called more than once.")
  cbCalled = true
  if (!er) return exit(0)
  log.error(er)
  if (!(er instanceof Error)) return exit(1)
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
    log.error(["","Failed to parse package.json data."
              ,"Note that package.json must be actual JSON, not"
              ,"just a JavaScript object."
              ,"","This changed in npm 0.3.0, and is not a bug in npm."
              ,"Tell the package author to fix their package.json file."
              ,""].join("\n"), "JSON.parse")
    break
  case npm.E404:
    log.error(["","Looks like '"+er.pkgid+"' is not in the npm registry."
              ,"You should bug the author to publish it."
              ,"Note that you can also install from a tarball or local folder.",""
              ].join("\n"), "404")
    break
  case npm.EPUBLISHCONFLICT:
    log.error( "Cannot publish over existing version.\n"
             + "Bump the 'version' field, set the --force flag, or\n"
             + "    npm unpublish '"+er.pkgid+"'\n"
             + "and try again"
             , "publish fail" )
    break
  default:
    log.error(["Report this *entire* log at <http://github.com/isaacs/npm/issues>"
              ,"or email it to <npm-@googlegroups.com>"
              ,"Just tweeting a tiny part of the error will not be helpful."
              ].join("\n"))
  }
  var os = require("os")
  log.error(os.type() + " " + os.release(), "System")
  log.error(npm.config.get("argv"), "argv")
  exit(typeof er.errno === "number" ? er.errno : 1)
}

function exit (code) {
  var doExit = npm.config.get("_exit")
  log.verbose([code, doExit], "exit")
  if (code) reallyExit()
  else rm(npm.tmp, reallyExit)
  function reallyExit() {
    itWorked = !code
    if (doExit) process.exit(code || 0)
    else process.emit("exit", code || 0)
  }
}
