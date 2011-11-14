module.exports = lock

var prompt = require("./utils/prompt.js")
  , path = require("path")
  , readJson = require("./utils/read-json.js")
  , fs = require("graceful-fs")
  , promiseChain = require("./utils/promise-chain.js")
  , exec = require("./utils/exec.js")
  , semver = require("semver")
  , log = require("./utils/log.js")
  , npm = require("./npm.js")
  , output = require("./utils/output.js")

    lock.usage = "npm lock [folder]"

function lock (args, cb) {
  var folder = args[0] || "."
    , ll = npm.config.get("loglevel")
  npm.config.set("loglevel", "paused")
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)

  readJson(path.join(folder, "package.json"), function (er, data) {
    if (er) data = {}

    lock_(data, folder, function (er) {
      npm.config.set("loglevel", ll)
      if (!er) log(path.resolve(folder, "package.json"), "written")
      cb(er)
    })
  })
}

function lock_ (data, folder, cb) {
    var dependencies = data.dependencies || {}
      , modules_path = path.join(folder, 'node_modules')

    fs.readdir(modules_path, function (err, dir) {
        if (err) throw err
        var counter = dir.length
        for (var i in dir) {
            readJson(path.join(modules_path, dir[i], "package.json"),
                function (err, d) {
                    if (!err) {
                        // Clobber original dependencies
                        console.log("adding dependency", d.name, "version", d.version)
                        dependencies[d.name] = d.version
                    }
                    // else we weren't able to read a file - throwing here is a waste of time
                    counter--
                    if (counter == 0) {
                        data.dependencies = dependencies || {}
                        Object.keys(data)
                          .filter(function (k) { return k.match(/^_/) })
                          .forEach(function (k) { delete data[k] })
                        fs.writeFile( path.join(folder, "package.json")
                                    , JSON.stringify(data, null, 2) + "\n"
                                    , cb )
                    }
                }
            )
        }
    })
}
