module.exports = prepare

var  path = require("path")
  , readJson = require("./utils/read-json.js")
  , fs = require("graceful-fs")
  , semver = require("semver")
  , log = require("./utils/log.js")
  , npm = require("./npm.js")
  , output = require("./utils/output.js")

  prepare.usage = "npm prepare [folder]"

function prepare (args, cb) {
  if (npm.config.get('global')) throw new Error('Cannot use lock in global context')

  var where = path.resolve(npm.dir, '..')
    , ll = npm.config.get("loglevel")
  npm.config.set("loglevel", "paused")

  readJson(path.join(where, "package.json")
          , {dev: !npm.config.get('production')}
          , function (er, data) {
    if (er) data = {}

    prepare_(data, function (er) {
      npm.config.set("loglevel", ll)
      if (!er) log(path.resolve(folder, "package.json"), "written")
      cb(er)
    })
  })
}

function prepare_ (data, cb) {
  var dependencies = data.dependencies || {}
    , where = path.resolve(npm.dir, '..')

  //whole-sale copied from installManyTop_
  fs.readdir(npm.dir, function (er, pkgs) {
    if (er) throw er
    pkgs = pkgs.filter(function (p) {
      return !p.match(/^[\._-]/)
          && (!explicit || names.indexOf(p) === -1)
    })
    asyncMap(pkgs.map(function (p) {
      return path.resolve(nm, p, "package.json")
    }), function (jsonfile, cb) {
      readJson(jsonfile, function (er, data) {
        if (er) return cb(null, [])
        return cb(null, [[data.name, data.version]])
      })
    }, function (er, packages) {
      // add all the existing packages to the family list.
      // however, do not add to the ancestors list.
      packages.forEach(function (p) {
        dependencies[p[0]] = (semver.gte(p[1], '0.1.0') ? '~' : '') + p[1]
      })
      return writePreparedJson(data, dependencies, cb)
    })
  })
}

function writePreparedJson (data, dependencies, cb) {
  data.dependencies = dependencies || {}
  Object.keys(data)
    .filter(function (k) { return k.match(/^_/) })
    .forEach(function (k) { delete data[k] })
  fs.writeFile( path.join(where, "package.json")
              , JSON.stringify(data, null, 2) + "\n"
              , cb )
}
