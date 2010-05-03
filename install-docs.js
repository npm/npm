
// a helper install script to install the documentation along with the program
// this runs whenever npm is activated or deactivated, so that the docs always
// reflect the current command.


// var event = process.env.npm_lifecycle_event

// var chain = require("./lib/utils/chain")
  // , exec = require("./lib/utils/exec")
  // , log = require("./lib/utils/log")
  // , fs = require("fs")
  // , path = require("path")
  // , rm = require("./lib/utils/rm-rf")

// log(event, "install docs")
return

fs.readdir(path.join(process.cwd(), "man"), function (er, docs) {
  log(path.join(process.cwd(), "man"), "readdir")
  if (er) throw er
  ;(function R (doc) {
    if (!doc) return
    switch (event) {
      case "activate":
        var target = path.join(process.prefix, "share/man/man1/", doc)
        rm( target
          , function () {
              fs.symlink
                ( path.join(process.cwd(), "man", doc)
                , path.join(target)
                , function (er, ok) {
                    if (er) throw er
                    R(docs.pop())
                  }
                )
            }
          )
      break
      case "deactivate":
        rm( path.join(process.prefix, "share/man/man1/", doc)
          , function (er) { R(docs.pop()) }
          )
      break
      default: throw new Error("invalid state"); break
    }
  })(docs.pop())
})
