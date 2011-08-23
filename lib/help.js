
module.exports = help

help.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb(null, [])
  var num = 1
  if (-1 !== opts.conf.argv.remain[1].indexOf("api")) num = 3
  getSections(num, cb)
}

var fs = require("graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec.js")
  , npm = require("../npm.js")
  , output = require("./utils/output.js")
  , log = require("./utils/log.js")

function help (args, cb) {
  var num = 1
    , argv = npm.config.get("argv").cooked
  if (argv.length && -1 !== argv[0].indexOf("api")) {
    num = 3
  }

  if (args.length > 1 && args[0]) {
    return npm.commands["help-search"](args, num, cb)
  }

  var section = args[0]
  if (section === "help" && num === 1) {
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
    var section_path = path.join( __dirname, "../man/man"
                                + num + "/" + section + "." + num)
    return fs.stat
      ( section_path
      , function (e, o) {
          if (e) return npm.commands["help-search"](args, cb)

          var manpath = path.join(__dirname, "..", "man")
            , env = {}
          Object.keys(process.env).forEach(function (i) {
            env[i] = process.env[i]
          })
          env.MANPATH = manpath
          var viewer = npm.config.get("viewer")
          switch (viewer) {
            case "woman":
              var a = ["-e", "(woman-find-file \"" + section_path + "\")"]
              exec("emacsclient", a, env, true, cb)
              break
            default:
              exec("man", [num, section], env, true, cb)
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
        , "npm <cmd> -h     quick help on <cmd>"
        , "npm faq          commonly asked questions"
        , "npm help <term>  search for help on <term>"
        , "npm help npm     involved overview"
        , ""
        , "Specify configs in the ini-formatted file at "
          + npm.config.get("userconfig")
        , "or on the command line via: npm <command> --key value"
        , "Config info can be viewed via: npm help config"
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

function getSections (num, cb) {
  if (typeof cb !== "function") cb = num, num = 1

  var mp = path.join(__dirname, "../man/man" + num + "/")
    , cleaner = new RegExp("\\." + num + "$")
  fs.readdir(mp, function (er, files) {
    if (er) return cb(er)
    var sectionList = files.concat("help." + num)
      .filter(function (s) { return s.match(cleaner) })
      .map(function (s) { return s.replace(cleaner, "")})
    cb(null, sectionList)
  })
}
