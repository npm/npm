
// npm registry-install <pkg> <pkg> <pkg>
// npm registry-install <pkg@version> <pkg@"1.0.0 - 1.99.99"> <pkg[@stable]> <pkg@tagname>

// 1. fetch the data for that package/tag
// 2. if it has any dependents, which are not yet installed,
// then add those to the list, and fetch their data.
// 3. when all the datas have been fetched, and we have a set
// of packages that are either installed or fetchable which
// will satisfy everyone's dependencies, then create the
// target root directories for each (so they're link-able)
// 4. download all the tarballs, and do npm install on each.

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

function registryInstall (pkglist, cb) {
  // it's helpful to know what we have already
  if (!installedPackages) return readInstalled([], function (er, data) {
    if (er) return cb(er)
    installedPackages = data
    registryInstall(pkglist, cb)
  })

  var defTag = npm.config.get("tag") || "stable"
  
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
      log("do the build", "registry-install")
      installList = installList.map(function (i) {
        return path.join(npm.dir, i, "package")
      })
      log(installList, "registry-install")
      if (installList.length === 0) {
        return log("nothing to install", "registry-install", cb)
      }
      return npm.commands.build
        ( installList
        , cb
        )
    }
    log(pkg, "registry-install pkg")
    if (seen[pkg]) {
      log("seen it", "registry-install")
      return F(pkglist.shift())
    }
    seen[pkg] = true
    if (pkg.match(/^https?:\/\//)) {
      return fetchTarball(pkg, function (er, data) {
        log(data, "fetched tarball")
        if (!npm.get(data._id)) npm.set(data)
        installedPackages[data.name] = installedPackages[data.name] || {}
        installedPackages[data.name][data.version] = data
        installReg[data.name] = installReg[data.name] || {}
        installReg[data.name][data.version] = data
        installList.push(path.join(data.name, data.version))
        // also make sure to get any dependencies.
        if (data.dependencies) for (var dep in data.dependencies) {
          dep = dep.trim()+"@"+data.dependencies[dep]
          if (!seen[dep]) pkglist.push(dep)
        }
        F(pkglist.shift())
      })
    }
    // now we know it's not a URL, so handle it like a tag, version, or range.
    pkg = pkg.split("@")
    var name = pkg[0]
      , ver = pkg.slice(1).join("@").trim()
      , range = semver.validRange(ver)
      , exact = semver.valid(ver)
      , tag = (!exact && !range)
    pkg = pkg.join("@")
    if (tag) {
      tag = ver || defTag
      log(tag, "registry-install tag")
      // must fetch data to know how to solve this.
      var data = npm.get(name)
      if (!data) return registry.get(name, function (er, data) {
        if (er) return cb(er)
        npm.set(name, data)
        seen[pkg] = false
        return F(pkg)
      })

      // now we know that we have the data.
      if (!data["dist-tags"] || !(tag in data["dist-tags"])) {
        return cb(new Error(
          "Tag "+tag+" not found for package "+name))
      }
      data = data.versions[data["dist-tags"][tag]]
      npm.set(data)
      // add that version to the list, and its dependencies
      if (!seen[name+"@"+data.version]) pkglist.push(name+"@"+data.version)
      if (data.dependencies) for (var dep in data.dependencies) {
        dep = dep.trim()+"@"+data.dependencies[dep]
        if (!seen[dep]) pkglist.push(dep)
      }
      return F(pkglist.shift())
    }
    // now we know it's not a tag.  Either a real version, or a range,
    // and possibly already installed.
    if (exact) {
      if ((name in installedPackages) && (ver in installedPackages[name])) {
        // already installed.  Continue.
        return F(pkglist.shift())
      }
      var data = npm.get(name)
      if (!data) return registry.get(name, function (er, data) {
        if (er) return cb(er)
        npm.set(name, data)
        seen[pkg] = false
        return F(pkg)
      })
      // make sure this version exists.
      if (!(ver in data.versions)) {
        return cb(new Error(
          "Required version "+name+"@"+ver+" not found in registry"))
      }
      data = data.versions[ver]
      // get the tarball, and add the deps.
      var tarball = data.dist.tarball
      if (!tarball) return cb(new Error(
        "No tarball URL found for "+name+"@"+ver))
      if (!seen[tarball]) pkglist.push(tarball)
      if (data.dependencies) for (var dep in data.dependencies) {
        dep = dep.trim()+"@"+data.dependencies[dep]
        if (!seen[dep]) pkglist.push(dep)
      }
      return F(pkglist.shift())
    }
    // now we know it's a range.  get the data for this package, and then
    // look for a matching version, and add that to the list.
    // satisfying version can come from any packages we've seen so far,
    // or anything on the "to be installed" list
    // this way, we prefer things that are already here, rather than adding
    // unnecessarily
    var satis = semver.maxSatisfying
        ( Object.keys(installedPackages[name] || {})
          .concat(Object.keys(installReg[name] || {}))
        , range)
    if (satis) {
      satis = name+"@"+satis
      if (!seen[satis]) pkglist.push(satis)
      return F(pkglist.shift())
    }
    // new thing.  fetch from registry.  favor stable version.
    var data = npm.get(name)
    if (!data) return registry.get(pkg, function (er, data) {
      if (er) return cb(er)
      npm.set(name, data)
      seen[pkg] = false
      F(pkg)
    })
    var stable = data["dist-tags"] && data["dist-tags"].stable
    if (stable && semver.satisfies(stable, range)) {
      stable = name + "@" + stable
      if (!seen[stable]) pkglist.push(stable)
      return F(pkglist.shift())
    }
    var satis = semver.maxSatisfying(Object.keys(data.versions), range)
    if (!satis) return cb(new Error(
      "No satisfying version found for "+name+"@"+range))
    data = data[satis]
    satis = name+"@"+satis
    if (!seen[satis]) pkglist.push(satis)
    if (data.dependencies) for (var dep in data.dependencies) {
      dep = dep.trim()+"@"+data.dependencies[dep]
      if (!seen[dep]) pkglist.push(dep)
    }
    return F(pkglist.shift())
  })(pkglist.shift())
}

// download the tarball, and move the contents into 
// the appropriate name/version folder.
function fetchTarball (tarball, cb) {
  var folder = path.join(npm.tmp, tarball.replace(/[^a-zA-Z0-9]/g, "-")+"-"+
                         Date.now()+"-"+Math.random())
    , target = folder + ".tgz"
  chain
    ( [mkdir, npm.tmp]
    , [mkdir, folder]
    , [fetch, tarball, target]
    , [unpackTar, target, folder]
    , function (er) {
        if (er) return cb(er)
        readJson(path.join(folder, "package.json"), function (er,data) {
          log(data, "readJson from "+folder)
          chain
            ( [moveIntoPlace, folder, data]
            , [log, "moved into place", "fuckererrrr"]
            , [rm, folder]
            , [rm, target]
            , function (er) { return cb(er, data) }
            )
        })
      }
    )
}

function unpackTar (tarball, unpackTarget, cb) {
  exec("tar", ["xzvf", tarball, "--strip", "1", "-C", unpackTarget], cb)
}

// move to ROOT/.npm/{name}/{version}/package
function moveIntoPlace (dir, data, cb) {
  if (!data.name || !data.version) {
    return cb(new Error("Name or version not found in package info."))
  }
  var target = path.join(npm.dir, data.name, data.version)
  log("to: "+target+" from: "+dir, "moveIntoPlace")
  
  chain
    ( [log, "in the chain1", "mvIntoPlc"]
    , function (cb) {
        log("in the chain", "moveIntoPlace")
        fs.lstat(target, function (e) {
          log((e?"remove":"creating") + " " +target, "moveIntoPlace")
          if (e) rm(target, function (er, ok) {
            if (er) {
              log("could not remove " + target, "moveIntoPlace")
              cb(new Error(target+" exists, and can't be removed"))
            } else {
              log("unlinked "+target,"moveIntoPlace")
              cb()
            }
          })
          else cb()
        })
      }
    , [mkdir, target]
    , [fs, "rename", dir, path.join(target, "package")]
    , [log, "done", "moveIntoPlace"]
    , cb
    )
}
