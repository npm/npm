
/*
adding a folder:
1. tar into tmp/random/package.tgz
2. untar into tmp/random/contents/{blah}
3. rename {blah} to "package"
4. tar tmp/random/package to cache/n/v/package.tgz
5. untar cache/n/v/package.tgz into cache/n/v/package
6. rm tmp/random and tmp/random.tgz

Adding a url:
1. fetch to tmp/random.tgz
2. goto folder(2)

adding a name@version:
1. registry.get(name, version)
2. if response isn't 304, add url(dist.tarball)

adding a name@range:
1. registry.get(name)
2. Find a version that satisfies
3. add name@version

adding a local tarball:
1. untar to tmp/random/{blah}
2. goto folder(2)
*/

exports = module.exports = cache
exports.read = read
exports.clean = clean
exports.unpack = unpack

var mkdir = require("./utils/mkdir-p")
  , exec = require("./utils/exec")
  , fetch = require("./utils/fetch")
  , npm = require("../npm")
  , fs = require("./utils/graceful-fs")
  , rm = require("./utils/rm-rf")
  , readJson = require("./utils/read-json")
  , registry = require("./utils/npm-registry-client")
  , log = require("./utils/log")
  , path = require("path")
  , output
  , sha = require("./utils/sha")
  , find = require("./utils/find")
  , asyncMap = require("./utils/async-map")
  , semver = require("semver")
  , tar = require("./utils/tar")
  , FMODE = tar.FMODE
  , DMODE = tar.DMODE

cache.usage = "npm cache add <tarball file>"
            + "\nnpm cache add <folder>"
            + "\nnpm cache add <tarball url>"
            + "\nnpm cache add <name>@<version>"
            + "\nnpm cache ls [<path>]"
            + "\nnpm cache clean [<pkg>[@<version>]]"

cache.completion = function(args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
    , getCompletions = require("./utils/completion/get-completions")
    , subcmdList = ["add", "clean", "ls"]
    , subcmd = args[0] || ""
    , onSubCmd = index === 2

  if (onSubCmd) return cb(null, getCompletions(subcmd, subcmdList))
  if (subcmd === "add") {
    return remotePkgs(args.slice(1), index - 1, true, false, false, cb)
  }
  // at this point, the only args that matter are after the subcmd
  index -= 3
  args = args.slice(1)
  var p = args.join("/").split("@").join("/").split("/")
    , cur = index < args.length ? p.pop() : ""
  p = p.join("/")

  // p is what we should ls_ for, cur is what we filter on
  return ls_(p, 3, function (er, files) {
    if (files) {
      files = getCompletions((p ? p+"/" : "")+cur, files)
    }
    if (!files || !files.length) {
      er = new Error("nothing found")
      files = null
    }
    cb(er, files)
  })
}

function cache (args, cb) {
  var cmd = args.shift()
  switch (cmd) {
    case "clean": return clean(args, cb)
    case "ls": return ls(args, cb)
    case "add": return add(args, cb)
    default: return cb(new Error(
      "Invalid cache action: "+cmd))
  }
}

// if the pkg and ver are in the cache, then
// just do a readJson and return.
// if they're not, then fetch them from the registry.
var cacheSeen = {}
function read (name, ver, cb) {
  var jsonFile = path.join(npm.cache, name, ver, "package.json")
  function c (er, data) {
    if (!er) cacheSeen[data._id] = data
    if (data) deprCheck(data)
    return cb(er, data)
  }
  if (npm.config.get("force")) {
    log.verbose(true, "force found, skipping cache")
    return addNamed(name, ver, c)
  }

  if (name+"@"+ver in cacheSeen) {
    return cb(null, cacheSeen[name+"@"+ver])
  }
  readJson(jsonFile, function (er, data) {
    if (er) return addNamed(name, ver, c)
    deprCheck(data)
    c(er, data)
  })
}

// npm cache ls [<path>]
function ls (args, cb) {
  output = output || require("./utils/output")
  args = args.join("/").split("@").join("/")
  if (args.substr(-1) === "/") args = args.substr(0, args.length - 1)
  ls_(args, function(er, files) {
    files = files.map(function (f) {
      return f.trim()
    }).filter(function (f) {
      return f
    })
    if (files.length) {
      output.write(files.join("\n"), cb_)
    } else cb_(null, files)
    function cb_ () { cb(null, files) }
  })
}

// Calls cb with list of cached pkgs matching show.
function ls_ (req, depth, cb) {
  if (typeof cb !== "function") cb = depth, depth = Infinity
  mkdir(npm.cache, function (er) {
    if (er) return log.er(cb, "no cache dir")(er)
    function dirFilter (f, type) {
      return type !== "dir" ||
        ( f && f !== npm.cache + "/" + req
         && f !== npm.cache + "/" + req + "/" )
    }
    find(path.join(npm.cache, req), dirFilter, depth, function (er, files) {
      if (er) return cb(er)
      return cb(null, files.map(function (f) {
        f = f.substr(npm.cache.length + 1)
        f = f.substr((f === req ? path.dirname(req) : req).length)
             .replace(/^\//, '')
        return f
      }))
    })
  })
}
// npm cache clean [<path>]
function clean (args, cb) {
  if (!cb) cb = args, args = []
  if (!args) args = []
  args = args.join("/").split("@").join("/")
  if (args.substr(-1) === "/") args = args.substr(0, args.length - 1)
  var f = path.join(npm.cache, path.normalize(args))
  if (f === npm.cache) {
    fs.readdir(npm.cache, function (er, files) {
      if (er) return cb()
      asyncMap( files.map(function (f) { return path.join(npm.cache, f) })
              , rm, cb )
    })
  } else rm(path.join(npm.cache, path.normalize(args)), cb)
}

// npm cache add <tarball-url>
// npm cache add <pkg> <ver>
// npm cache add <tarball>
// npm cache add <folder>
exports.add = function (pkg, ver, scrub, cb) {
  if (typeof cb !== "function") cb = scrub, scrub = false
  if (typeof cb !== "function") cb = ver, ver = null
  if (scrub) {
    return clean([], function (er) {
      if (er) return cb(er)
      add([pkg, ver], cb)
    })
  }
  log.verbose([pkg, ver], "cache add")
  return add([pkg, ver], cb)
}
function add (args, cb) {
  if (args[0] && args[0].indexOf("@") !== -1) {
    args = args[0].split("@")
  }
  var pkg = args.shift()
    , ver = args.shift()
  if (!pkg && !ver) {
    var usage = "Usage:\n"
              + "    npm cache add <tarball-url>\n"
              + "    npm cache add <pkg>@<ver>\n"
              + "    npm cache add <tarball>\n"
              + "    npm cache add <folder>\n"
    return cb(new Error(usage))
  }
  if (pkg && ver) return addNamed(pkg, ver, cb)
  if (pkg.match(/^https?:\/\//)) return addRemoteTarball(pkg, cb)
  else addLocal(pkg, cb)
}

function addRemoteTarball (url, shasum, name, cb) {
  if (!cb) cb = name, name = ""
  if (!cb) cb = shasum, shasum = null
  log.verbose([url, shasum], "addRemoteTarball")
  // todo: take a shasum, and validate it.
  var tmp = path.join(npm.tmp, Date.now()+"-"+Math.random(), "tmp.tgz")
  mkdir(path.dirname(tmp), function (er) {
    if (er) return cb(er)
    fetch(url, tmp, function (er) {
      if (er) return log.er(cb, "failed to fetch "+url)(er)
      if (!shasum) return done()
      // validate that the url we just downloaded matches the expected shasum.
      sha.check(tmp, shasum, done)
    })
  })
  function done (er) {
    if (er) return cb(er)
    addLocalTarball(tmp, name, cb)
  }
}

function addNamed (name, x, cb) {
  log.info([name, x], "addNamed")
  log.verbose([semver.valid(x), semver.validRange(x)], "addNamed")
  return ( null !== semver.valid(x) ? addNameVersion
         : null !== semver.validRange(x) ? addNameRange
         : addNameTag
         )(name, x, cb)
}

function addNameTag (name, tag, cb) {
  log([name, tag], "addNameTag")
  var explicit = true
  if (!tag) {
    explicit = false
    tag = npm.config.get("tag")
  }

  registry.get(name, function (er, data, json, response) {
    if (er) return cb(er)
    engineFilter(data)
    if (data["dist-tags"] && data["dist-tags"][tag]) {
      return addNameVersion(name, data["dist-tags"][tag], cb)
    }
    if (!explicit) return addNameRange(name, "*", cb)
    return cb(installTargetsError(tag, data))
  })
}

function engineFilter (data) {
  var npmv = npm.version
    , nodev = process.version
  Object.keys(data.versions).forEach(function (v) {
    var eng = data.versions[v].engines
    if (!eng) return
    if (eng.node && !semver.satisfies(nodev, eng.node)
        || eng.npm && !semver.satisfies(npmv, eng.npm)) {
      delete data.versions[v]
    }
  })
}

function addNameRange (name, range, cb) {
  range = semver.validRange(range)
  if (range === null) return cb(new Error(
    "Invalid version range: "+range))
  registry.get(name, function (er, data, json, response) {
    if (er) return cb(er)
    engineFilter(data)
    // if the tagged version satisfies, then use that.
    var tagged = data["dist-tags"][npm.config.get("tag")]
    if (tagged && semver.satisfies(tagged, range)) {
      return addNameVersion(name, tagged, cb)
    }
    // find the max satisfying version.
    var ms = semver.maxSatisfying(Object.keys(data.versions), range)
    if (!ms) {
      return cb(installTargetsError(range, data))
    }
    addNameVersion(name, ms, cb)
  })
}

function installTargetsError (requested, data) {
  return new Error("Not found: "+data.name+"@'"+requested+"'\n"
                  +"Valid install targets:\n"
                  +JSON.stringify(Object.keys(data["dist-tags"])
                          .concat(Object.keys(data.versions))))
}

function addNameVersion (name, ver, cb) {
  ver = semver.valid(ver)
  if (ver === null) return cb(new Error("Invalid version: "+ver))
  registry.get(name, ver, function (er, data, json, response) {
    if (er) return cb(er)
    deprCheck(data)
    if (!data.dist || !data.dist.tarball) return cb(new Error(
      "No dist.tarball in package data"))
    if (response.statusCode !== 304 || npm.config.get("force")) {
      return fetchit()
    }
    // we got cached data, so let's see if we have a tarball.
    fs.stat(path.join(npm.cache, name, ver, "package.tgz"), function (er, s) {
      if (!er) return cb(null, data)
      else return fetchit()
    })
    function fetchit () {
      return addRemoteTarball( data.dist.tarball.replace(/^https/,'http')
                             , data.dist.shasum, name+"-"+ver, cb)
    }
  })
}

function addLocal (p, name, cb) {
  if (!cb) cb = name, name = ""
  // figure out if this is a folder or file.
  fs.stat(p, function (er, s) {
    if (er) {
      // if it doesn't have a / in it, it might be a
      // remote thing.
      if (p.indexOf("/") === -1) return addNamed(p, "", cb)
      return log.er(cb, "Doesn't exist: "+p)(er)
    }
    if (s.isDirectory()) addLocalDirectory(p, name, cb)
    else addLocalTarball(p, name, cb)
  })
}

function addLocalTarball (p, name, cb) {
  if (!cb) cb = name, name = ""
  // if it's a tar, and not in place,
  // then unzip to .tmp, add the tmp folder, and clean up tmp
  if (p.indexOf(npm.tmp) === 0) return addTmpTarball(p, name, cb)

  if (p.indexOf(npm.cache) === 0) {
    if (path.basename(p) !== "package.tgz") return cb(new Error(
      "Not a valid cache tarball name: "+p))
    return addPlacedTarball(p, name, cb)
  }

  // just copy it over and then add the temp tarball file.
  var tmp = path.join(npm.tmp, name + Date.now()
                             + "-" + Math.random(), "tmp.tgz")
  mkdir(path.dirname(tmp), function (er) {
    if (er) return cb(er)
    var from = fs.createReadStream(p)
      , to = fs.createWriteStream(tmp)
      , errState = null
    function errHandler (er) {
      if (errState) return
      return cb(errState = er)
    }
    from.on("error", errHandler)
    to.on("error", errHandler)
    to.on("close", function () {
      if (errState) return
      fs.chmod(tmp, FMODE, function (er) {
        if (er) return cb(er)
        addTmpTarball(tmp, name, cb)
      })
    })
    from.pipe(to)
  })
}

function addPlacedTarball (p, name, cb) {
  if (!cb) cb = name, name = ""
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var target = path.dirname(p)
    , folder = path.join(target, "package")
    , json = path.join(target, "package.json")
  rm(folder, function (er) {
    if (er) return log.er(cb, "Could not remove "+folder)(er)
    tar.unpack(p, folder, function (er) {
      if (er) return log.er(cb, "Could not unpack "+p+" to "+target)(er)
      // calculate the sha of the file that we just unpacked.
      // this is so that the data is available when publishing.
      sha.get(p, function (er, shasum) {
        if (er) return log.er(cb, "couldn't validate shasum of "+p)(er)
        readJson(path.join(folder, "package.json"), function (er, data) {
          if (er) return log.er(cb, "coulnd't read json in "+folder)(er)
          data.dist = data.dist || {}
          if (shasum) data.dist.shasum = shasum
          deprCheck(data)
          fs.writeFile(json, JSON.stringify(data,null,2), function (er) {
            if (er) return log.er(cb, "Could not write to "+json)(er)
            asyncMap([json, p], function (f, cb) {
              fs.chmod(f, FMODE, cb)
            }, function (er) {
              cb(er, data)
            })
          })
        })
      })
    })
  })
}

function addLocalDirectory (p, name, cb) {
  if (!cb) cb = name, name = ""
  // if it's a folder, then read the package.json,
  // tar it to the proper place, and add the cache tar
  if (p.indexOf(npm.cache) === 0) return cb(new Error(
    "Adding a cache directory to the cache will make the world implode."))
  readJson(path.join(p, "package.json"), function (er, data) {
    if (er) return log.er(cb, "couldn't read package.json in "+p)(er)
    deprCheck(data)
    var random = Date.now() + "-" + Math.random()
      , tmp = path.join(npm.tmp, random)
      , tmptgz = path.resolve(tmp, "tmp.tgz")
      , placed = path.resolve( npm.cache, data.name
                             , data.version, "package.tgz" )
      , placeDirect = path.basename(p) === "package"
      , tgz = placeDirect ? placed : tmptgz
      , doFancyCrap = p.indexOf(npm.tmp) !== 0
                    && p.indexOf(npm.cache) !== 0
    tar.pack(tgz, p, data, doFancyCrap, function (er) {
      if (er) return log.er(cb,"couldn't pack "+p+ " to "+tgz)(er)
      addLocalTarball(tgz, name, cb)
    })
  })
}

function addTmpTarball (tgz, name, cb) {
  if (!cb) cb = name, name = ""
  var contents = path.join(path.dirname(tgz),"contents")
  tar.unpack(tgz, path.resolve(contents, "package"), function (er) {
    if (er) return log.er(cb, "couldn't unpack "+tgz+" to "+contents)(er)
    fs.readdir(contents, function (er, folder) {
      if (er) return log.er(cb, "couldn't readdir "+contents)(er)
      log.verbose(folder, "tarball contents")
      if (folder.length > 1) {
        folder = folder.filter(function (f) { return !f.match(/^\./) })
      }
      if (folder.length > 1) {
        log.warn(folder.slice(1).join("\n")
                ,"extra junk in folder, ignoring")
      }
      if (!folder.length) return cb(new Error("Empty package tarball"))
      folder = path.join(contents, folder[0])
      var newName = path.join(contents, "package")
      fs.rename(folder, newName, function (er) {
        if (er) return log.er(cb, "couldn't rename "+folder+" to package")(er)
        addLocalDirectory(newName, name, cb)
      })
    })
  })
}

function unpack (pkg, ver, unpackTarget, dMode, fMode, uid, gid, cb) {
  read(pkg, ver, function (er, data) {
    if (er) return log.er(cb, "Could not read data for "+pkg+"@"+ver)(er)
    tar.unpack( path.join(npm.cache, pkg, ver, "package.tgz")
             , unpackTarget
             , dMode, fMode
             , uid, gid
             , cb )
  })
}

var deprecated = {}
  , deprWarned = {}
function deprCheck (data) {
  if (deprecated[data._id]) data.deprecated = deprecated[data._id]
  if (data.deprecated) deprecated[data._id] = data.deprecated
  else return
  if (!deprWarned[data._id]) {
    deprWarned[data._id] = true
    log.warn(data._id+": "+data.deprecated, "deprecated")
  }
}
