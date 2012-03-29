
// initialize a package.json file

module.exports = init

var read = require("read")
  , path = require("path")
  , readJson = require("./utils/read-json.js")
  , fs = require("graceful-fs")
  , promiseChain = require("./utils/promise-chain.js")
  , doWhile = require("./utils/do-while.js")
  , exec = require("./utils/exec.js")
  , semver = require("semver")
  , log = require("./utils/log.js")
  , npm = require("./npm.js")
  , output = require("./utils/output.js")

init.usage = "npm init [folder]"

function init (args, cb) {
  var folder = args[0] || "."
    , ll = npm.config.get("loglevel")
  npm.config.set("loglevel", "paused")
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)

  readJson(path.join(folder, "package.json"), function (er, data) {
    if (er) data = {}

    data.author = data.author ||
      { name: npm.config.get("init.author.name")
      , email: npm.config.get("init.author.email")
      , url: npm.config.get("init.author.url") }

    init_(data, folder, function (er) {
      npm.config.set("loglevel", ll)
      if (!er) log(path.resolve(folder, "package.json"), "written")
      cb(er)
    })
  })
}

function init_ (data, folder, cb) {
  var nv = npm.config.get("node-version")
    , p = semver.parse(nv)
    , eng = ""

  if (!p[5]) eng = "~" + nv
  else eng = "~" + [p[1], p[2], p[3]].join(".") + " || " + nv

  // node version 0.n is api-compatible with 0.(n+1) when n is odd.
  if (p[2] % 2) {
    eng += " || " + [p[1], +(p[2]) + 1].join(".")
  }


  output.write(
    ["This utility will walk you through creating a package.json file."
    ,"It only covers the most common items, and tries to guess sane defaults."
    ,""
    ,"See `npm help json` for definitive documentation on these fields"
    ,"and exactly what they do."
    ,""
    ,"Use `npm install <pkg> --save` afterwards to install a package and"
    ,"save it as a dependency in the package.json file."
    ,""
    ,"Press ^C at any time to quit."
    ,""
    ].join("\n"))
  promiseChain(cb)
    ( read
    , [{prompt: "Package name: ", default: defaultName(folder, data)}]
    , function (n) { data.name = n }
    )
    ( read
    , [{prompt: "Description: ", default: data.description}]
    , function (d) { data.description = d }
    )
    ( defaultVersion, [folder, data], function (v) { data.version = v } )
    (function (cb) {
      read( { prompt: "Package version: ", default: data.version }
          , function (er, v) {
        if (er) return cb(er)
        data.version = v
        cb()
      })
    }, [])
    ( read
    , [ { prompt: "Project homepage: "
        , default: data.homepage || data.url || "none" } ]
    , function (u) {
        if (u === "none") return
        data.homepage = u
        delete data.url
      }
    )
    ( defaultRepo, [folder, data], function (r) { data.repository = r } )
    (function (cb) {
      read( { prompt: "Project git repository: "
            , default: data.repository && data.repository.url || "none" }
          , function (er, r) {
              if (er) return cb(er)
              if (r !== "none") {
                data.repository = (data.repository || {}).url = r
              }
              cb()
            }
          )
    }, [])
    ( read
    , [{ prompt: "Author name: ", default: data.author && data.author.name }]
    , function (n) {
        if (!n) return
        (data.author = data.author || {}).name = n
      }
    )
    ( read
    , [ { prompt: "Author email: " 
        , default: data.author && data.author.email || "none" } ]
    , function (n) {
        if (n === "none") return
        (data.author = data.author || {}).email = n
      }
    )
    ( read
    , [ { prompt: "Author url: "
        , default: data.author && data.author.url || "none" } ]
    , function (n) {
        if (n === "none") return
        (data.author = data.author || {}).url = n
      }
    )
    ( read
    , [ { prompt: "Main module/entry point: ", default: data.main || "none" } ]
    , function (m) {
        if (m === "none") {
          delete data.main
          return
        }
        data.main = m
      }
    )
    ( read
    , [ { prompt: "Test command: "
        , default: data.scripts && data.scripts.test || "none" } ]
    , function (t) {
        if (t === "none") return
        (data.scripts = data.scripts || {}).test = t
      }
    )
    (function (cb) {
      read({ prompt: "Would you like to process dependencies? "
           , default: "yes" }
           , function (er, ok) {

        if (er) return cb(er)
        if (ok.toLowerCase().charAt(0) !== "y") {
          return cb()
        }

        return dependencies(folder, data, cb)
      })
    })
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
      output.write(msg, cb)
    })
    (function (cb) {
      read({ prompt: "\nIs this ok? ", default: "yes" }, function (er, ok) {
        if (er) return cb(er)
        if (ok.toLowerCase().charAt(0) !== "y") {
          return cb(new Error("cancelled"))
        }
        return cb()
      })
    })
    (function (cb) {
      fs.writeFile( path.join(folder, "package.json")
                  , JSON.stringify(data, null, 2) + "\n"
                  , cb )
    })
    ()
}

// async - yes io
function dependencies (folder, data, cb) {
  var folders
    , packages = []

  promiseChain(cb)
    (function (cb) {
      fs.readdir(folder + '/node_modules', function (er, fo) {
        folders = fo

        cb()
      })
    })
    (function (cb) {
      var count = 0
      folders.forEach(function (folder) {
        var file = './node_modules/' + folder + '/package.json';
        fs.readFile(file, 'utf8', function (er, json) {
          count += 1

          if (!er) {
            try {
              packages.push(JSON.parse(json))
            }
            catch (e) {
              //parse failed, who cares?
            }
          }

          if (count == folders.length) {
            cb()
          }
        })
      })
    })
    //TODO: search for each module discovered to ensure the module/version
    //is available with npm
    (function (cb) {
      var count = 0

      if (packages.length) {
        if (!data.dependencies) data.dependencies = {}
        if (!data.devDependencies) data.devDependencies = {}
      }

      doWhile(function (next) {
        var package = packages[count]
          , defaultAnswer = (data.devDependencies[package.name]) 
              ? "dev" 
              : "yes"
          , prompt = ["Would you like to add the dependency"
                     ,package.name
                     ,"@"
                     ,package.version
                     ,"? [yes/no/dev]"
          ].join(" ")

        count += 1

        //TODO: offer more options for selecting version compatibility
        read({ prompt: prompt, default: defaultAnswer }, function (er, ok) {
          if (er) return cb(er)

          switch (ok.toLowerCase().charAt(0)) {
            case 'y' :
              delete data.devDependencies[package.name]
              data.dependencies[package.name] = package.version
              break
            case 'd' :
              delete data.dependencies[package.name]
              data.devDependencies[package.name] = package.version
              break
            case 'n' :
              delete data.dependencies[package.name]
              delete data.devDependencies[package.name]
              break
            default :
          }

          next(count !== packages.length)
        })
      }, function () {
        cb()
      })
    })
    ()
}

// sync - no io
function defaultName (folder, data) {
  if (data.name) return data.name
  return path.basename(folder)
             .replace(/^node[-\._]?|([-\._]node)[-\._]?(js)?$/g, "")
}

function defaultVersion (folder, data, cb) {
  if (data.version) return cb(null, data.version)
  exec(npm.config.get("git"), ["describe", "--tags"], process.env, false, folder,
       function (er, code, out) {
    out = (out || "").trim()
    if (semver.valid(out)) return cb(null, out)
    out = npm.config.get("init.version")
    if (semver.valid(out)) return cb(null, out)
    return cb(null, "0.0.0")
  })
}

function defaultRepo (folder, data, cb) {
  if (data.repository) return cb(null, data.repository)
  exec( npm.config.get("git"), ["remote", "-v"], process.env, false, folder
      , function (er, code, out) {
    out = (out || "")
      .trim()
      .split("\n").filter(function (line) {
        return line.search(/^origin/) !== -1
      })[0]
    if (!out) return cb(null, {})
    var repo =
      { type: "git"
      , url: out.split(/\s/)[1]
                .replace("git@github.com:", "git://github.com/")
      }
    return cb(null, repo)
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
