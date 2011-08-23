
module.exports = help

help.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb(null, [])
  getSections(cb)
}

var fs = require("graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec.js")
  , npm = require("../npm.js")
  , output = require("./utils/output.js")

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
        , npm.config.get("long") ? usages()
          : "    " + wrap(Object.keys(npm.commands))
        , ""
        , "npm <cmd> -h     quick help on <cmd>"
        , "npm -l           display full usage info"
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

function usages () {
  // return a string of <cmd>: <usage>
  var maxLen = 0
  return Object.keys(npm.commands).filter(function (c) {
    return c === npm.deref(c)
  }).reduce(function (set, c) {
    set.push([c, npm.commands[c].usage || ""])
    maxLen = Math.max(maxLen, c.length)
    return set
  }, []).map(function (item) {
    var c = item[0]
      , usage = item[1]
    return "\n    " + c + (new Array(maxLen - c.length + 2).join(" "))
         + (usage.split("\n")
            .join("\n" + (new Array(maxLen + 6).join(" "))))
  }).join("\n")
  return out
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
