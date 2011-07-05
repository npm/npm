
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
  , fileCompletion = require("./utils/completion/file-completion")
  , url = require("url")

cache.usage = "npm cache add <tarball file>"
            + "\nnpm cache add <folder>"
            + "\nnpm cache add <tarball url>"
            + "\nnpm cache add <name>@<version>"
            + "\nnpm cache ls [<path>]"
            + "\nnpm cache clean [<pkg>[@<version>]]"

cache.completion = function (opts, cb) {

  var argv = opts.conf.argv.remain
  if (argv.length === 2) {
    return cb(null, ["add", "ls", "clean"])
  }

  switch (argv[2]) {
    case "clean":
    case "ls":
      // cache and ls are easy, because the completion is
      // what ls_ returns anyway.
      // just get the partial words, minus the last path part
      var p = path.dirname(opts.partialWords.slice(3).join("/"))
      if (p === ".") p = ""
      return ls_(p, 2, cb)
    case "add":
      // Same semantics as install and publish.
      return npm.commands.install.completion(opts, cb)
  }
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
function read (name, ver, forceBypass, cb) {
  if (typeof cb !== "function") cb = forceBypass, forceBypass = true
  var jsonFile = path.join(npm.cache, name, ver, "package", "package.json")
  function c (er, data) {
    if (!er) cacheSeen[data._id] = data
    if (data) deprCheck(data)
    return cb(er, data)
  }

  if (forceBypass
      && (npm.config.get("force")
          || process.platform === "cygwin")) {
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
  ls_(args, npm.config.get("depth"), function(er, files) {
    output.write(files.map(function (f) {
      return path.join("~/.npm", f)
    }).join("\n").trim(), function (er) {
      return cb(er, files)
    })
  })
}

// Calls cb with list of cached pkgs matching show.
function ls_ (req, depth, cb) {
  return fileCompletion(npm.cache, req, depth, cb)
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

// Only have a single download action at once for a given url
// additional calls stack the callbacks.
var inFlightURLs = {}
function addRemoteTarball (url, shasum, name, cb_) {
  if (typeof cb_ !== "function") cb_ = name, name = ""
  if (typeof cb_ !== "function") cb_ = shasum, shasum = null

  if (!inFlightURLs[url]) inFlightURLs[url] = []
  var iF = inFlightURLs[url]
  iF.push(cb_)
  if (iF.length > 1) return

  function cb (er, data) {
    var c
    while (c = iF.shift()) c(er, data)
    delete inFlightURLs[url]
  }

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

// only have one request in flight for a given
// name@blah thing.
var inFlightNames = {}
function addNamed (name, x, cb_) {
  log.info([name, x], "addNamed")
  var k = name + "@" + x
  if (!inFlightNames[k]) inFlightNames[k] = []
  var iF = inFlightNames[k]
  iF.push(cb_)
  if (iF.length > 1) return

  function cb (er, data) {
    var c
    while (c = iF.shift()) c(er, data)
    delete inFlightNames[k]
  }

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
    if (data["dist-tags"] && data["dist-tags"][tag]
        && data.versions[data["dist-tags"][tag]]) {
      return addNameVersion(name, data["dist-tags"][tag], cb)
    }
    if (!explicit && Object.keys(data.versions).length) {
      return addNameRange(name, "*", cb)
    }
    return cb(installTargetsError(tag, data))
  })
}

function engineFilter (data) {
  var npmv = npm.version
    , nodev = npm.config.get("node-version")
  Object.keys(data.versions || {}).forEach(function (v) {
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
    var ms = semver.maxSatisfying(Object.keys(data.versions || {}), range)
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
                          .concat(Object.keys(data.versions || {}))))
}

function addNameVersion (name, ver, cb) {
  ver = semver.valid(ver)
  if (ver === null) return cb(new Error("Invalid version: "+ver))
  registry.get(name, ver, function (er, data, json, response) {
    if (er) return cb(er)
    deprCheck(data)
    var dist = data.dist

    if (!dist) return cb(new Error("No dist in "+data._id+" package"))

    var bd = npm.config.get("bindist")
      , b = dist.bin && bd && dist.bin[bd]
    log.verbose([bd, dist], "bin dist")
    if (b && b.tarball && b.shasum) {
      log.info(data._id, "prebuilt")
      log.verbose(b, "prebuilt "+data._id)
      dist = b
    }

    if (!dist.tarball) return cb(new Error(
      "No dist.tarball in " + data._id + " package"))

    if (response.statusCode !== 304 || npm.config.get("force")
        || process.platform === "cygwin") {
      return fetchit()
    }

    // we got cached data, so let's see if we have a tarball.
    fs.stat(path.join(npm.cache, name, ver, "package.tgz"), function (er, s) {
      if (!er) readJson( path.join( npm.cache, name, ver
                                  , "package", "package.json" )
                       , function (er, data) {
          if (er) return fetchit()
          return cb(null, data)
        })
      else return fetchit()
    })

    function fetchit () {
      // use the same protocol as the registry.
      // https registry --> https tarballs.
      var tb = url.parse(dist.tarball)
      tb.protocol = url.parse(npm.config.get("registry")).protocol
      delete tb.href
      tb = url.format(tb)
      return addRemoteTarball( tb
                             , dist.shasum
                             , name+"-"+ver
                             , cb )
    }
  })
}

function addLocal (p, name, cb_) {
  if (typeof cb_ !== "function") cb_ = name, name = ""

  function cb (er, data) {
    if (er) {
      // if it doesn't have a / in it, it might be a
      // remote thing.
      if (p.indexOf("/") === -1 && p.charAt(0) !== ".") {
        return addNamed(p, "", cb_)
      }
      return log.er(cb_, "Could not install: "+p)(er)
    }
    return cb_(er, data)
  }

  // figure out if this is a folder or file.
  fs.stat(p, function (er, s) {
    if (er) return cb(er)
    if (s.isDirectory()) addLocalDirectory(p, name, cb)
    else addLocalTarball(p, name, cb)
  })
}

function addLocalTarball (p, name, cb) {
  if (typeof cb !== "function") cb = name, name = ""
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
      log.verbose(FMODE.toString(8), "chmod "+tmp)
      fs.chmod(tmp, FMODE, function (er) {
        if (er) return cb(er)
        addTmpTarball(tmp, name, cb)
      })
    })
    from.pipe(to)
  })
}

// to maintain the cache dir's permissions consistently.
var cacheStat = null
function getCacheStat (cb) {
  if (cacheStat) return cb(null, cacheStat)
  fs.stat(npm.cache, function (er, st) {
    if (er) return makeCacheDir(cb)
    if (!st.isDirectory()) {
      return log.er(cb, "invalid cache directory: "+npm.cache)(er)
    }
    return cb(null, cacheStat = st)
  })
}

function makeCacheDir (cb) {
  if (!process.getuid) return mkdir(npm.cache, DMODE, cb)

  var uid = +process.getuid()
    , gid = +process.getgid()

  if (uid === 0) {
    if (process.env.SUDO_UID) uid = +process.env.SUDO_UID
    if (process.env.SUDO_GID) gid = +process.env.SUDO_GID
  }
  if (uid !== 0 || !process.env.HOME) {
    cacheStat = {uid: uid, gid: gid}
    return mkdir(npm.cache, DMODE, uid, gid, function (er) {
      return cb(er, cacheStat)
    })
  }
  fs.stat(process.env.HOME, function (er, st) {
    if (er) return log.er(cb, "homeless?")(er)
    cacheStat = st
    log.silly([st.uid, st.gid], "uid, gid for cache dir")
    return mkdir(npm.cache, DMODE, st.uid, st.gid, function (er) {
      return cb(er, cacheStat)
    })
  })
}




function addPlacedTarball (p, name, cb) {
  if (!cb) cb = name, name = ""
  getCacheStat(function (er, cs) {
    if (er) return cb(er)
    return addPlacedTarball_(p, name, cs.uid, cs.gid, cb)
  })
}

function addPlacedTarball_ (p, name, uid, gid, cb) {
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var target = path.dirname(p)
    , folder = path.join(target, "package")

  rm(folder, function (er) {
    if (er) return log.er(cb, "Could not remove "+folder)(er)
    tar.unpack(p, folder, null, null, uid, gid, function (er) {
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
          asyncMap([p], function (f, cb) {
            log.verbose(FMODE.toString(8), "chmod "+f)
            fs.chmod(f, FMODE, cb)
          }, function (f, cb) {
            fs.chown(f, uid, gid, cb)
          }, function (er) {
            cb(er, data)
          })
        })
      })
    })
  })
}

function addLocalDirectory (p, name, cb) {
  if (typeof cb !== "function") cb = name, name = ""
  // if it's a folder, then read the package.json,
  // tar it to the proper place, and add the cache tar
  if (p.indexOf(npm.cache) === 0) return cb(new Error(
    "Adding a cache directory to the cache will make the world implode."))
  readJson(path.join(p, "package.json"), function (er, data) {
    if (er) return cb(er)
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
  getCacheStat(function (er, cs) {
    if (er) return cb(er)
    return addTmpTarball_(tgz, name, cs.uid, cs.gid, cb)
  })
}

function addTmpTarball_ (tgz, name, uid, gid, cb) {
  var contents = path.resolve(path.dirname(tgz), "contents")
  tar.unpack( tgz, path.resolve(contents, "package")
            , null, null
            , uid, gid
            , function (er) {
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
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (typeof cb !== "function") cb = fMode, fMode = null
  if (typeof cb !== "function") cb = dMode, dMode = null

  read(pkg, ver, false, function (er, data) {
    if (er) {
      log.error("Could not read data for "+pkg+"@"+ver)
      return cb(er)
    }
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
