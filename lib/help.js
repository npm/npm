
var fs = require("./utils/graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec")
  , npm = require("../npm")

module.exports = help

function help (args, cb) {
  var section = args.shift()
  if (section === "help") {
    section = !npm.config.get("usage") && "npm"
  }
  if (section) {
    if ( npm.config.get("usage")
      && npm.commands[section]
      && npm.commands[section].usage
    ) {
      npm.config.set("loglevel", "silent")
      console.log(npm.commands[section].usage)
      return cb()
    }
    var section_path = path.join(__dirname, "../man1/"+section+".1")
    return fs.stat
      ( section_path
      , function (e, o) {
          if (e) return cb(new Error("Help section not found: "+section))
          // function exec (cmd, args, env, takeOver, cb) {
          var manpath = path.join(__dirname, "..")
            , env = {}
          Object.keys(process.env).forEach(function (i) { env[i] = process.env[i] })
          env.MANPATH = manpath
          var viewer = npm.config.get("viewer")
          switch (viewer) {
            case "woman":
              var args = ["-e", "(woman-find-file \"" + section_path + "\")"]
              exec("emacsclient", args, env, true, cb)
              break
            default:
              exec("man", [section], env, true, cb)
          }
        }
      )
  } else fs.readdir(path.join(__dirname, "../man1/"), function (er, sections) {
    npm.config.set("loglevel", "silent")
    console.log
      (["\nUsage: npm <command>"
      , ""
      , "where <command> is one of:"
      , "    "+wrap(Object.keys(npm.commands))
      , ""
      , "Add -h to any command for quick help."
      , ""
      , "Specify configs in the ini-formatted file at "+npm.config.get("userconfig")
      , "or on the command line via: npm <command> --key value"
      , "Config info can be by running: npm help config"
      , ""
      , "Help usage: npm help <section>"
      , ""
      , "where <section> is one of:"
      , (er && er.message)
        || ("    " + wrap(
          sections.concat("help.1")
            .filter(function (s) { return s.match(/\.1$/) })
            .map(function (s) { return s.replace(/\.1$/, '')})
        ))
      , ""
      , "Even more help at: npm help help"
      ].join("\n"))
    cb(er)
  })
}

function wrap (arr) {
  var out = ['']
    , l = 0
  arr.sort(function (a,b) { return a<b?-1:1 })
    .forEach(function (c) {
      if (out[l].length + c.length + 2 < 60) {
        out[l] += ', '+c
      } else {
        out[l++] += ','
        out[l] = c
      }
    })
  return out.join("\n    ").substr(2)
}


