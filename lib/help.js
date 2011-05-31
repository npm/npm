
module.exports = help

help.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb(null, [])
  getSections(cb)
}

var fs = require("./utils/graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec")
  , npm = require("../npm")
  , output = require("./utils/output")

function help (args, cb) {
  if (args.length > 1 && args[0]) return npm.commands["help-search"](args, cb)
  var section = args[0]
  if (section === "help") {
    section = !npm.config.get("usage") && "npm"
  }
  if (section) {
    if ( npm.config.get("usage")
      && npm.commands[section]
      && npm.commands[section].usage
    ) {
      npm.config.set("loglevel", "silent")
      return output.write(npm.commands[section].usage, cb)
    }
    var section_path = path.join(__dirname, "../man1/"+section+".1")
    return fs.stat
      ( section_path
      , function (e, o) {
          if (e) return npm.commands["help-search"](args, cb)

          var manpath = path.join(__dirname, "..")
            , env = {}
          Object.keys(process.env).forEach(function (i) { env[i] = process.env[i] })
          env.MANPATH = manpath
          var viewer = npm.config.get("viewer")
          switch (viewer) {
            case "woman":
              var a = ["-e", "(woman-find-file \"" + section_path + "\")"]
              exec("emacsclient", a, env, true, cb)
              break
            default:
              exec("man", [section], env, true, cb)
          }
        }
      )
  } else getSections(function (er, sections) {
    if (er) return cb(er)
    npm.config.set("loglevel", "silent")
    output.write
      ( ["\nUsage: npm <command>"
        , ""
        , "where <command> is one of:"
        , "    "+wrap(Object.keys(npm.commands))
        , ""
        , "Add -h to any command for quick help."
        , ""
        , "Specify configs in the ini-formatted file at "
          + npm.config.get("userconfig")
        , "or on the command line via: npm <command> --key value"
        , "Config info can be viewed via: npm help config"
        , ""
        , "Help usage: npm help <section>"
        , ""
        , "where <section> is one of:"
        , "    " + wrap(sections)
        , ""
        , "Even more help at: npm help help"
        ].join("\n"), function () { cb(er) })
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

function getSections(cb) {
  fs.readdir(path.join(__dirname, "../man1/"), function (er, files) {
    if (er) return cb(er)
    var sectionList = files.concat("help.1")
      .filter(function (s) { return s.match(/\.1$/) })
      .map(function (s) { return s.replace(/\.1$/, '')})
    cb(null, sectionList)
  })
}
