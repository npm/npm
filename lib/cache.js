
/*
new technique for tarring

goal:
1. get rid of the -C and --strip-components nonsense
2. always have a consistent folder name in the package.tgz files

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

adding a name/version:
1. registry.get(name, version)
2. if response isn't 304, add url(dist.tarball)

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
  , pipe = exec.pipe
  , spawn = exec.spawn
  , fetch = require("./utils/fetch")
  , npm = require("../npm")
  , fs = require("./utils/graceful-fs")
  , rm = require("./utils/rm-rf")
  , readJson = require("./utils/read-json")
  , registry = require("./utils/registry")
  , log = require("./utils/log")
  , path = require("path")
  , sys = require("./utils/sys")
  , output = require("./utils/output")
  , sha = require("./utils/sha")

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

  if (subcmdList.indexOf(subcmd) !== -1) {
    if (subcmd === "add") {
      remotePkgs(args.slice(1), index - 1, true, false, false, cb)
    }
  } else if (index < 3) cb(null, getCompletions(subcmd, subcmdList))
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
  if (name+"@"+ver in cacheSeen) {
    return cb(null, cacheSeen[name+"@"+ver])
  }
  readJson(jsonFile, function (er, data) {
    if (er) return addNameVersion(name, ver, c)
    deprCheck(data)
    c(er, data)
  })
}

// npm cache ls [<pkg>[@<ver>]]
function ls (args, cb) {
  if (args[0] && args[0].indexOf("@") !== -1) {
    args = args[0].split("@")
  }
  var show = path.join.apply(path, args)
    , read = npm.cache
    , msg = "cache ls"+(show?" "+show:"")
  read = path.join(read, show)
  mkdir(npm.cache, function (er) {
    if (er) return log.er(cb, "no cache dir")(er)
    fs.readdir(read, function (er, files) {
      if (er) {
        log("nothing found", "cache")
        return cb()
      }
      files = files.filter(function (f) { return f !== "." && f !== ".." })
      if (!files.length) {
        log("nothing found", "cache")
        return cb()
      }
      var prefix = (show ? show + "/" : "")
      output.write(npm.config.get("outfd"), prefix+files.join("\n"+prefix), cb_)
      function cb_ () { cb(null, files) }
    })
  })
}

// npm cache clean [<pkg> [<ver>]]
function clean (args, cb) {
  if (!cb) cb = args, args = []
  if (!args) args = []
  if (args[0] && args[0].indexOf("@") !== -1) {
    args = args[0].split("@")
  }
  var pkg = args.shift()
    , ver = args.shift()
    , clean = npm.cache
  if (pkg) clean = path.join(clean, pkg)
  if (ver) clean = path.join(clean, ver)
  cb = log.er(cb, "Could not remove "+clean)
  rm(clean, cb)
}

// npm cache add <tarball-url>
// npm cache add <pkg> <ver>
// npm cache add <tarball>
// npm cache add <folder>
exports.add = function (pkg, ver, cb) {
  if (!cb && typeof ver === "function") cb = ver, ver = null
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
              + "    npm cache add <pkg> <ver>\n"
              + "    npm cache add <tarball>\n"
              + "    npm cache add <folder>\n"
    return cb(new Error(usage))
  }
  if (pkg && ver) return addNameVersion(pkg, ver, cb)
  if (pkg.match(/^https?:\/\//)) return addRemoteTarball(pkg, cb)
  else addLocal(pkg, cb)
}
function addRemoteTarball (url, shasum, cb) {
  if (!cb) cb = shasum, shasum = null
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
    addLocalTarball(tmp, cb)
  }
}
function addNameVersion (name, ver, cb) {
  registry.get(name, ver, function (er, data, json, response) {
    if (er) return cb(er)
    deprCheck(data)
    if (!data.dist || !data.dist.tarball) return cb(new Error(
      "No dist.tarball in package data"))
    //TODO: put the shasum in the data, and pass to addRemoteTarball
    if (response.statusCode !== 304) return fetchit()
    // we got cached data, so let's see if we have a tarball.
    fs.stat(path.join(npm.cache, name, ver, "package.tgz"), function (er, s) {
      if (!er) return cb(null, data)
      else return fetchit()
    })
    function fetchit () {
      return addRemoteTarball( data.dist.tarball.replace(/^https/,'http')
                             , data.dist.shasum, cb)
    }
  })
}

function addLocal (p, cb) {
  // figure out if this is a folder or file.
  fs.stat(p, function (er, s) {
    if (er) return log.er(cb, "Doesn't exist: "+p)(er)
    if (s.isDirectory()) addLocalDirectory(p, cb)
    else addLocalTarball(p, cb)
  })
}
function addLocalTarball (p, cb) {
  // if it's a tar, and not in place,
  // then unzip to .tmp, add the tmp folder, and clean up tmp
  if (p.indexOf(npm.tmp) === 0) return addTmpTarball(p, cb)

  if (p.indexOf(npm.cache) === 0) {
    if (path.basename(p) !== "package.tgz") return cb(new Error(
      "Not a valid cache tarball name: "+p))
    return addPlacedTarball(p, cb)
  }

  // just copy it over and then add the temp tarball file.
  var tmp = path.join(npm.tmp, Date.now() + "-" + Math.random(), "tmp.tgz")
  mkdir(path.dirname(tmp), function (er) {
    if (er) return cb(er)
    var from = fs.createReadStream(p)
      , to = fs.createReadStream(tmp)
      , errState = null
    function errHandler (er) {
      if (errState) return
      return cb(errState = er)
    }
    from.on("error", errHandler)
    to.on("error", errHandler)
    sys.pump(from, to, function () { addTmpTarball(tmp, cb) })
  })
}
function addPlacedTarball (p, cb) {
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var target = path.dirname(p)
    , folder = path.join(target, "package")
    , json = path.join(target, "package.json")
  rm(folder, function (e) {
    if (e) return log.er(cb, "Could not remove "+folder)(er)
    unpackTar(p, target, function (er) {
      if (er) return cb(er)
      // calculate the sha of the file that we just unpacked.
      // this is so that the data is available when publishing.
      sha.get(p, function (er, shasum) {
        if (er) return cb(er)
        readJson(path.join(folder, "package.json"), function (er, data) {
          if (er) return cb(er)
          data.dist = data.dist || {}
          if (shasum) data.dist.shasum = shasum
          deprCheck(data)
          fs.writeFile(json, JSON.stringify(data,null,2), function (er) {
            if (er) return log.er(cb, "Could not write to "+json)(er)
            cb(null, data)
          })
        })
      })
    })
  })
}
function addLocalDirectory (p, cb) {
  // if it's a folder, then read the package.json,
  // tar it to the proper place, and add the cache tar
  if (p.indexOf(npm.cache) === 0) return cb(new Error(
    "Adding a cache directory to the cache will make the world implode."))
  if (npm.dir.indexOf(p) === 0 || p.indexOf(npm.dir) === 0) {
    return cb(new Error("Adding npm dir into cache, not allowed"))
  }
  readJson(path.join(p, "package.json"), function (er, data) {
    if (er) return cb(er)
    deprCheck(data)
    var random = Date.now() + "-" + Math.random()
      , tmp = path.join(npm.tmp, random)
      , tmptgz = path.join(tmp, "tmp.tgz")
      , placed = path.join(npm.cache, data.name, data.version, "package.tgz")
      , tgz = path.basename(p) === "package" ? placed : tmptgz
    packTar(tgz, p, function (er) {
      if (er) return cb(er)
      addLocalTarball(tgz, cb)
    })
  })
}
function addTmpTarball (tgz, cb) {
  var contents = path.join(path.dirname(tgz),"contents")
  unpackTar(tgz, contents, function (er) {
    if (er) return cb(er)
    try { process.chdir(contents) }
    catch (ex) { return cb(ex) }
    fs.readdir(contents, function (er, folder) {
      if (er) return cb(er)
      if (folder.length > 1) {
        log.warn(folder, "Excess stuff in package tarball")
      }
      if (!folder.length) return cb(new Error(
        "Empty package tarball"))
      folder = folder[0]
      fs.rename(folder, "package", function (er) {
        if (er) return cb(er)
        addLocalDirectory(path.join(contents, "package"), cb)
      })
    })
  })
}

function unpack (pkg, ver, unpackTarget, cb) {
  read(pkg, ver, function (er, data) {
    if (er) return log.er(cb, "Could not read data for "+pkg+"@"+ver)(er)
    unpackTar( path.join(npm.cache, pkg, ver, "package.tgz")
             , unpackTarget
             , cb
             )
  })
}

function unpackTar (tarball, unpackTarget, cb) {
  mkdir(unpackTarget, function (er) {
    if (er) return log.er(cb, "Could not create "+unpackTarget)(er)
    // cp the gzip of the tarball, pipe the stdout into tar's stdin
    // gzip {tarball} --decompress --stdout | tar xf - --strip-components=1 -C {unpackTarget}
    pipe( spawn(npm.config.get("gzipbin"), ["--decompress", "--stdout", tarball])
        , spawn( npm.config.get("tar")
               , ["-vxpf", "-", "-C", unpackTarget]
               )
        , log.er(cb, "Failed unpacking the tarball.\n"
                   + "This is very rare. Perhaps the 'gzip' or 'tar' configs\n"
                   + "are set improperly?\n")
        )
  })
}
function packTar (targetTarball, folder, cb) {
  log.verbose(folder+" "+targetTarball, "packTar")
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  if (folder.slice(-1) === "/") folder = folder.slice(0, -1)
  var cwd = process.cwd()
    , parent = path.dirname(folder)
    , addFolder = path.basename(folder)
    , ignore = path.join(folder, ".npmignore")
    , defaultIgnore = path.join(__dirname, "utils", "default.npmignore")
    , include = path.join(folder, ".npminclude")
  cb = log.er(cb, "Failed creating the tarball.\n"
             + "This is very rare. Perhaps the 'gzip' or 'tar' configs\n"
             + "are set improperly?\n")

  fs.stat(ignore, function (er) {
    if (er) ignore = defaultIgnore
    fs.stat(include, function (er) {
      if (er) include = false
      mkdir(path.dirname(targetTarball), function (er) {
        if (er) return log.er(cb, "Could not create "+targetTarball)(er)
        try { process.chdir(parent) }
        catch (ex) { return log.er(cb, "Could not chdir to "+parent)(er) }
        // tar xf - --strip-components=1 -C {unpackTarget} | gzip {tarball} > targetTarball
        var target = fs.createWriteStream(targetTarball)
          , unPacked = false
          , args = [ "-cvf", "-", "--exclude", ".git", "-X", ignore]
        if (include) args.push("-T", include)
        args.push(addFolder)
        var tar = spawn(npm.config.get("tar"), args)
          , gzip = spawn(npm.config.get("gzipbin"), ["--stdout"])
          , errState
        pipe(tar, gzip, function (er) {
          if (errState) return
          if (er) return cb(errState = er)
        })
        sys.pump(gzip.stdout, target, function (er, ok) {
          if (errState) return
          if (er) return cb(errState = er)
          process.chdir(cwd)
          cb()
        })
      })
    })
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
