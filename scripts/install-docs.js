
// a helper install script to install the documentation along with the program
// this runs whenever npm is activated or deactivated, so that the docs always
// reflect the current command.

var event = process.env.npm_lifecycle_event
  , npm = require("../npm")
  , exec = require("../lib/utils/exec")
  , log = require("../lib/utils/log")
  , fs = require("fs")
  , path = require("path")
  , rm = require("../lib/utils/rm-rf")
  , mkdir = require("../lib/utils/mkdir-p")
  , manTarget = path.join(process.installPrefix, "share/man/man1")
  , exec = require("../lib/utils/exec")

log(event, "docs")

function dontPanic (er) {
  log(er, "doc install failed")
  log("probably still ok otherwise, though", "don't panic")
}

exec("manpath", [], null, true, function (er, code, stdout, stderr) {
  var manpath = er ? [] : stdout.trim().split(":")
  if (manpath.indexOf(path.dirname(manTarget)) === -1) {
    log("It seems " + manTarget + " might not be visible to man", "!")
    log("For greater justice, please add it to your man path", "!")
    log("See: man man", "!")
  }
  mkdir(manTarget, function (er) {
    if (er) dontPanic(er)
    else installDocs()
  })
})
function installDocs () {
  fs.readdir(path.join(process.cwd(), "man"), function (er, docs) {
    log(path.join(process.cwd(), "man"), "docs")
    log(manTarget, "docs")
    if (er) return
    ;(function R (doc) {
      if (!doc) return log("done", "docs")
      if (doc === "." || doc === "..") return R(docs.pop())
      var target = path.join(manTarget, "npm-"+doc)
      target = target.replace(/npm-npm\.1$/, "npm.1")
      switch (event) {
        case "activate":
          rm( target
            , function () {
                fs.symlink
                  ( path.join(process.cwd(), "man", doc)
                  , target
                  , function (er, ok) {
                      if (er) dontPanic(er)
                      else R(docs.pop())
                    }
                  )
              }
            )
        break
        case "deactivate":
          rm( target, function (er) { R(docs.pop()) })
        break
        default: throw new Error("invalid state"); break
      }
    })(docs.pop())
  })
}
