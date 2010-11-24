
// initialize a package.json file

module.exports = init

var prompt = require("./utils/prompt")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , fs = require("./utils/graceful-fs")
  , promiseChain = require("./utils/promise-chain")
  , exec = require("./utils/exec")
  , semver = require("./utils/semver")
  , log = require("./utils/log")
  , npm = require("../npm")
  , output = require("./utils/output")

init.usage = "npm init [folder]"

function init (args, cb) {
  var folder = args[0] || "."
    , ll = npm.config.get("loglevel")
  npm.config.set("loglevel", "paused")
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  try { process.chdir(folder) }
  catch (ex) { ex.message += ": "+folder ; return cb(ex) }

  readJson(path.join(folder, "package.json"), function (er, data) {
    if (er) data = {}
    init_(data, folder, function (er) {
      npm.config.set("loglevel", ll)
      if (!er) log(path.join(folder, "package.json"), "written")
      cb(er)
    })
  })
}
function init_ (data, folder, cb) {
  var dl
    , outfd = npm.config.get("outfd")
  output.write(outfd,
    ["This utility will walk you through creating a package.json file."
    ,"It only covers the most common items, and tries to guess sane defaults."
    ,"See `npm help json` for definitive documentation on these fields"
    ,"and exactly what they do."
    ,"Press ^C at any time to quit."
    ,""
    ].join("\n"))
  promiseChain(cb)
    ( prompt
    , ["Package name: ", defaultName(folder, data)]
    , function (n) { data.name = n }
    )
    ( prompt
    , ["Description: ", data.description]
    , function (d) { data.description = d }
    )
    ( defaultVersion, [folder, data], function (v) { data.version = v } )
    (function (cb) {
      prompt("Package version: ", data.version, function (er, v) {
        if (er) return cb(er)
        data.version = v
        cb()
      })
    }, [])
    ( prompt
    , ["Project homepage: ", data.homepage || data.url || "(none)"]
    , function (u) {
        if (u === "(none)") return
        data.homepage = u
        delete data.url
      }
    )
    ( prompt
    , ["Author name: ", data.author && data.author.name]
    , function (n) {
        if (!n) return
        (data.author = data.author || {}).name = n
      }
    )
    ( prompt
    , ["Author email: ", data.author && data.author.email || "(none)"]
    , function (n) {
        if (n === "(none)") return
        (data.author = data.author || {}).email = n
      }
    )
    ( prompt
    , ["Author url: ", data.author && data.author.url || "(none)"]
    , function (n) {
        if (n === "(none)") return
        (data.author = data.author || {}).url = n
      }
    )
    ( prompt
    , ["Main module/entry point: ", data.main || "(none)"]
    , function (m) {
        if (m === "(none)") {
          delete data.main
          return
        }
        data.main = m
      }
    )
    ( defaultLib, [data, folder], function (d) { dl = d } )
    ( function (cb) {
        prompt("Which folder do your modules live in: ", dl, cb)
      }
    , []
    , function (l) {
        if (l === "(none)") {
          if (data.directories && data.directories.lib) {
            delete data.directories.lib
          }
          return
        }
        (data.directories = data.directories || {}).lib = l
      }
    )
    ( prompt
    , ["Test command: ", data.scripts && data.scripts.test || "(none)"]
    , function (t) {
        if (t === "(none)") return
        (data.scripts = data.scripts || {}).test = t
      }
    )
    ( prompt
    , [ "What versions of node does it run on? "
      , data.engines && data.engines.node || "*"
      ]
    , function (nodever) {
        (data.engines = data.engines || {}).node = nodever
      }
    )
    // todo: friendly dependency resolution stuffs.
    (cleanupPaths, [data, folder])
    (function (cb) {
      try { data = readJson.processJson(data) }
      catch (er) { return cb(er) }
      Object.keys(data)
        .filter(function (k) { return k.match(/^_/) })
        .forEach(function (k) { delete data[k] })
      readJson.unParsePeople(data)
      var str = JSON.stringify(data, null, 2)
        , msg = "About to write to "
              + path.join(folder, "package.json")
              + "\n\n"
              + str
              + "\n\n"
      output.write(outfd, msg, cb)
    })
    (function (cb) {
      prompt("\nIs this ok? ", "yes", function (er, ok) {
        if (er) return cb(er)
        if (ok.toLowerCase().charAt(0) !== "y") {
          return cb(new Error("cancelled"))
        }
        return cb()
      })
    })
    (function (cb) {
      fs.writeFile( path.join(folder, "package.json")
                  , JSON.stringify(data, null, 2)
                  , cb
                  )
    })
    ()
}

function defaultLib (data, folder, cb) {
  // existing lib setting?
  if (data.directories && data.directories.lib) {
    return cb(null, data.directories.lib)
  }
  // two options at this point.
  // if main is ./lib/name.js, look first for ./lib/name/
  // failing that, use ./lib
  // if main is ./foo.js, then look for ./lib
  var l
  if (data.main) {
    l = path.join(folder, path.dirname(data.main))
  } else {
    l = folder
  }
  // now try to walk down any ./lib or ./name folders we can find.
  // it just has to be a reasonable guess
  defaultLibWalker(l, data.name, cb)
}
function defaultLibWalker (folder, name, cb) {
  fs.readdir(folder, function (er, files) {
    // oops?
    return (er) ? cb(null, path.dirname(folder)) // oops?
          : (files.indexOf(name) !== -1) ?
              defaultLibWalker(path.join(folder, name), name, cb)
          : (files.indexOf("lib") !== -1) ?
              defaultLibWalker(path.join(folder, "lib"), name, cb)
          : cb(null, folder)
  })
}
// sync - no io
function defaultName (folder, data) {
  if (data.name) return data.name
  return path.basename(folder).replace(/^node[_-]?|[-\.]?js$/g, '')
}

function defaultVersion (folder, data, cb) {
  if (data.version) return cb(null, data.version)
  process.chdir(folder)
  exec("git", ["describe", "--tags"], process.env, false, function (er, code, out) {
    out = (out || "").trim()
    if (semver.valid(out)) return cb(null, out)
    return cb(null, "0.0.0")
  })
}

function cleanupPaths (data, folder, cb) {
  if (data.main) {
    data.main = cleanupPath(data.main, folder)
  }
  var dirs = data.directories
  if (dirs) {
    Object.keys(dirs).forEach(function (dir) {
      dirs[dir] = cleanupPath(dirs[dir], folder)
    })
  }
  cb()
}
function cleanupPath (m, folder) {
  if (m.indexOf(folder) === 0) m = path.join(".", m.substr(folder.length))
  return m
}
