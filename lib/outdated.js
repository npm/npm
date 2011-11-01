/*

npm outdated [pkg]

Does the following:

1. check for a new version of pkg

If no packages are specified, then run for all installed
packages.

*/

module.exports = outdated

outdated.usage = "npm outdated [<pkg> [<pkg> ...]]"

outdated.completion = require("./utils/completion/installed-deep.js")


var path = require("path")
  , fs = require("graceful-fs")
  , readJson = require("./utils/read-json.js")
  , cache = require("./cache.js")
  , asyncMap = require("slide").asyncMap
  , npm = require("../npm.js")
  , log = require("./utils/log.js")
  , semver = require("semver")
  , relativize = require("./utils/relativize.js")
  , get = require("./utils/npm-registry-client/get.js")

function outdated (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false
  var dir = npm.prefix
  if (npm.config.get("global")) dir = path.resolve(dir, "lib")
  outdated_(args, dir, {}, function (er, list) {
    function cb_ (er) { cb(er, list) }

    if (er || silent) return cb_(er)
    var outList = list.map(makePretty)
    require("./utils/output.js").write(outList.join("\n"), cb_)
  })
}

// [[ dir, dep, has, want ]]
function makePretty (p) {
  var parseable = npm.config.get("parseable")
    , long = npm.config.get("long")
    , dep = p[1]
    , dir = path.resolve(p[0], "node_modules", dep)
    , has = p[2]
    , want = p[3]
    , newer = p[4]
  var depStatus = has ? (dep + "@" + has) : "MISSING"
  if (newer) {
    if (semver.lte(newer, want)) {
      depStatus = "CANUPDATE("+newer+" available)"
    } else {
      depStatus = "OUTDATED("+newer+" available)"	  
    }
  }
  if (parseable) {
    var str = dir
    if (npm.config.get("long")) {
      str += ":" + dep + "@" + want
           + ":" + depStatus
    }
    return str
  }

  if (!npm.config.get("global")) {
    dir = relativize(dir, process.cwd()+"/x")
  }
  return dep + "@" + want + " " + dir
       + " current=" + (depStatus || has || "MISSING")
}

function outdated_ (args, dir, parentHas, cb) {
  // get the deps from package.json, or {<dir/node_modules/*>:"*"}
  // asyncMap over deps:
  //   shouldHave = cache.add(dep, req).version
  //   if has === shouldHave then
  //     return outdated(args, dir/node_modules/dep, parentHas + has)
  //   else if dep in args or args is empty
  //     return [dir, dep, has, shouldHave]

  var deps = null
  readJson(path.resolve(dir, "package.json"), function (er, d) {
    deps = (er) ? true : d.dependencies
    discoverNew(deps)
    return next()
  })

  var has = null
  fs.readdir(path.resolve(dir, "node_modules"), function (er, pkgs) {
    if (er) {
      has = Object.create(parentHas)
      return next()
    }
    asyncMap(pkgs, function (pkg, cb) {
      readJson(path.resolve(dir, "node_modules", pkg, "package.json")
              , function (er, d) {
        cb(null, er ? [] : [[d.name, d.version]])
      })
    }, function (er, pvs) {
      if (er) return cb(er)
      has = Object.create(parentHas)
      pvs.forEach(function (pv) { 
        has[pv[0]] = pv[1]
      })
      next()
    })
  })

  function discoverNew (deps) {
    asyncMap(deps, function (dep, cb_) {
        var depName = Object.keys(dep)[0]
        get(depName, function (er, doc) {
          var versions = Object.keys(doc.versions)
          var newest = versions[versions.length-1]
	  cb_(null, {"name": depName, "current": dep[depName], "newest": newest})
        })
      }, function (er, results) {
        results.forEach(function (dep) {
            if (semver.gte(dep.newest, dep.current)) {
              cb(null, [[dir, dep.name, dep.current, dep.current, dep.newest]])        
            }      		    
          })
      }
    )
  }

  function next () {
    if (!has || !deps) return
    if (deps === true) {
      deps = Object.keys(has).reduce(function (l, r) {
        l[r] = "*"
        return l
      }, {})
    }
    // now get what we should have, based on the dep.
    // if has[dep] !== shouldHave[dep], then cb with the data
    // otherwise dive into the folder
    asyncMap(Object.keys(deps), function (dep, cb) {
      shouldUpdate(args, dir, dep, has, deps[dep], cb)
    }, cb)
  }
}

function shouldUpdate (args, dir, dep, has, req, cb) {
  // look up the most recent version.
  // if that's what we already have, or if it's not on the args list,
  // then dive into it.  Otherwise, cb() with the data.

  function skip () {
    outdated_( args
             , path.resolve(dir, "node_modules", dep)
             , has
             , cb )
  }

  function doIt (shouldHave) {
    cb(null, [[ dir, dep, has[dep], shouldHave ]])
  }

  if (args.length && args.indexOf(dep) === -1) {
    return skip()
  }

  // so, we can conceivably update this.  find out if we need to.
  cache.add(dep, req, function (er, d) {
    // if this fails, then it means we can't update this thing.
    // it's probably a thing that isn't published.
    return (er || d.version === has[dep]) ? skip() : doIt(d.version)
  })
}

