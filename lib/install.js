
// npm install <pkg> <pkg> <pkg>
// npm install <pkg@version> <pkg@"1.0.0 - 1.99.99"> <pkg[@stable]> <pkg@tagname>

// 1. fetch the data for that package/tag into the cache
// 2. if it has any dependents, which are not yet installed,
// then add those to the list, and fetch their data.
// 3. when all the pkgs are fetched to the cache, and we have a set
// of packages that are either installed or fetched which
// will satisfy everyone's dependencies, then untar into the
// target directories for each of them.
// 4. build each of the packages that aren't already installed

module.exports = registryInstall

var registry = require("./utils/registry")
  , npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , installedPackages
  , semver = require("./utils/semver")
  , url = require("url")
  , fetch = require("./utils/fetch")
  , exec = require("./utils/exec")
  , rm = require("./utils/rm-rf")
  , mkdir = require("./utils/mkdir-p")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , path = require("path")
  , chain = require("./utils/chain")
  , fs = require("fs")
  , cache = require("./cache")

function registryInstall (pkglist, cb) {
  if (pkglist.length === 0) pkglist = ["."]
  // it's helpful to know what we have already
  if (!installedPackages) return readInstalled([], function (er, data) {
    if (er) return cb(er)
    installedPackages = data || {}
    registryInstall(pkglist, cb)
  })

  var defTag = npm.config.get("tag")

  // While the list is not empty:
  // a. If it's a range, and a satisfying version is already installed,
  //    then move on to the next
  // b. If it's a tag version, then fetch the json, and add the specific
  //    version to the list.
  // c. If it's not already installed, then fetch its
  //    json, and find the satisfying version. Add
  //    dependencies and tarball url to the list.
  // d. If it's a url, fetch and unpack it to the appropriate pkg/version
  //    folder, add it to the "installed" list, add its deps to the list
  //    and move on

  // When the list is empty, build all the package folders that were created.
  var installList = []
    , seen = {}
    , installReg = {}
  ;(function F (pkg) {
    if (!pkg) {
      return buildAll(installList, cb)
    }
    log(pkg, "install pkg")
    if (seen[pkg]) {
      log("seen it", "install")
      return F(pkglist.shift())
    }
    seen[pkg] = true

    // Call this with the parsed package data when we know
    // that it's sitting in the cache
    function Continue (er, data) {
      if (er) return log.er(cb, "Error installing "+pkg)(er)
      if (!data._nodeSupported) return cb(new Error(
        data.name+"@"+data.version+" not compatible with node@"+process.version))
      seen[data.name+"@"+data.version] = true
      var p = path.join(data.name, data.version)
        , ir = installReg
      if (!installReg[data.name] || !installReg[data.name][data.version]) {
        installList.push(p)
        ;(ir[data.name] = ir[data.name] || {})[data.version] = true
      }
      // also add the dependencies.
      if (data.dependencies) for (var dep in data.dependencies) {
        dep = dep.trim()+"@"+data.dependencies[dep]
        if (!seen[dep]) pkglist.push(dep)
      }
      F(pkglist.shift())
    }

    // it's a local thing or a url if it has a / in it.
    if (pkg.indexOf("/") !== -1 || pkg === ".") {
      log(pkg, "install local")
      return cache.add(pkg, Continue)
    }

    // now we know it's not a URL or file,
    // so handle it like a tag, version, or range.
    pkg = pkg.split("@")
    var name = pkg[0]
      , ver = pkg.slice(1).join("@").trim()
      , range = semver.validRange(ver)
      , exact = semver.valid(ver)
      , tag = (!exact && range === null)
    pkg = pkg.join("@")

    // if it's an exact name/version, and not already installed, then pull
    // the data out of the cache to ensure it's there, and then add deps.
    if (exact) {
      if ( (name in installedPackages) && (ver in installedPackages[name])
        || (name in installReg) && (ver in installReg[name])
        ) {
        // already installed.  Continue.
        return F(pkglist.shift())
      }
      return cache.read(name, ver, Continue)
    }

    // if a range, then check to see if we have it installed (or about to be)
    // already, and if so, continue with that.
    if (!tag) {
      // satisfying version can come from any packages we've seen so far,
      // or anything on the "to be installed" list
      // this way, we prefer things that are already here, rather than adding
      // unnecessarily
      var satis = semver.maxSatisfying
          ( Object.keys(installedPackages[name] || {})
            .concat(Object.keys(installReg[name] || {}))
          , range
          )
      // if there is a satisfying version already, then simply move on.
      if (satis) return F(pkglist.shift())
    }

    // if not exact, and not already installed, then fetch the root data
    // so that we have the tags and all the versions, and can know what's
    // available.
    var data = npm.get(name)
    if (!data) {
      log(name, "fetch data")
      return registry.get(name, function (er, data) {
        if (!er && !data) er = new Error("not found in registry: "+name)
        if (er) return cb(er)
        if (!data._id) data._id = name
        try {
          for (var ver in data.versions) {
            readJson.processJson(data.versions[ver])
          }
        } catch (ex) {
          return log.er(cb, "error processing versions")(ex)
        }
        npm.set(data)
        seen[pkg] = false
        return F(pkg)
      })
    }

    // now we know that we have the data.
    if (tag) {
      tag = ver || defTag
      if (!data["dist-tags"] || !(tag in data["dist-tags"])) {
        return cb(new Error("Tag "+tag+" not found for package "+name))
      }
      data = data.versions[data["dist-tags"][tag]]
      if (!seen[name+"@"+data.version]) pkglist.push(name+"@"+data.version)
      return F(pkglist.shift())
    }


    // now we know it's a range, and not already satisfied.
    // get the data for this package, and then
    // look for a matching version, and add that to the list.
    // favor defTag version.
    var data = npm.get(name)
      , stable = data["dist-tags"] && data["dist-tags"][defTag]
    filterNodeVersion(data)
    if (stable && semver.satisfies(stable, range) && data.versions[stable]) {
      log(data.versions[stable], name+"@"+defTag)
      stable = name + "@" + stable
      if (!seen[stable]) pkglist.push(stable)
      return F(pkglist.shift())
    }
    var satis = semver.maxSatisfying(Object.keys(data.versions), range)
    if (!satis) return cb(new Error(
      "No satisfying version found for "+name+"@"+range))
    // now just install as an explicit version.
    satis = name+"@"+satis
    if (!seen[satis]) pkglist.push(satis)
    return F(pkglist.shift())
  })(pkglist.shift())
}

function filterNodeVersion (data) {
  for (var v in data.versions) {
    log(data.versions[v]._nodeSupported, "nodeSupported by "+data.name+"@"+v)
    if (!data.versions[v]._nodeSupported) {
      delete data.versions[v]
    }
  }
}

function buildAll (list, cb) {
  if (list.length === 0) {
    return log("Nothing to install", "install", cb)
  }
  log("About to unpack", "buildAll")
  chain
    ( [unpackAll, list]
    , [build, list]
    , cb
    )
}
function unpackAll (list, cb) {
  list = list.map(function (i) { return i.split('/') })
  ;(function U (i) {
    if (!i) return cb()
    var target = path.join(npm.dir, i[0], i[1], "package")
    cache.unpack(i[0], i[1], target, function (er) {
      if (er) return cb(er)
      return U(list.shift())
    })
  })(list.shift())
}
function build (list, cb) {
  npm.commands.build
    ( list.map(function (i) { return path.join(npm.dir, i, "package") })
    , cb
    )
}
