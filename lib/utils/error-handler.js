
module.exports = errorHandler

var cbCalled = false
  , log = require("./log")
  , npm = require("../../npm")
  , rm = require("./rm-rf")
  , constants
  , itWorked = false

try { constants = require("constants") }
catch (ex) { constants = process }

process.on("exit", function () { if (!itWorked) log.win("not ok") })

function errorHandler (er) {
  if (cbCalled) throw new Error("Callback called more than once.")
  cbCalled = true
  if (!er) {
    itWorked = true
    log.win("ok")
    return exit()
  }
  log.error(er)
  if (!(er instanceof Error)) return exit(1)
  switch (er.errno) {
  case constants.ECONNREFUSED:
    log.error(["If you are using Cygwin, please set up your /etc/resolv.conf"
              ,"See step 3 in this wiki page:"
              ,"    http://github.com/ry/node/wiki/Building-node.js-on-Cygwin-%28Windows%29"
              ,"If you are not using Cygwin, please report this"
              ,"at <http://github.com/isaacs/npm/issues>"
              ,"or email it to <npm-@googlegroups.com>"
              ].join("\n"))
    break
  case constants.EACCES:
    log.error(["There appear to be some permission problems"
              ,"See the section on 'Permission Errors' at"
              ,"  http://github.com/isaacs/npm#readme"
              ,"This will get better in the future, I promise."
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
              ,"There may be additional logging output above."
              ].join("\n"))
    break
  case npm.E404:
    log.error(["","Looks like '"+er.pkgid+"' is not in the npm registry."
              ,"You should bug the author to publish it."
              ,"Note that you can also install from a tarball or local folder.",""
              ].join("\n"), "404")
    break
  default:
    log.error(["Report this *entire* log at <http://github.com/isaacs/npm/issues>"
              ,"or email it to <npm-@googlegroups.com>"
              ,"Just tweeting a tiny part of the error will not be helpful."
              ].join("\n"))
  }
  exit(1)
}

function exit (code) {
  rm(npm.tmp, function () { process.exit(code || 0) })
}
