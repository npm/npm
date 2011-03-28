
module.exports = publish

var npm = require("../npm")
  , registry = require("./utils/npm-registry-client")
  , log = require("./utils/log")
  , binTag = require("./utils/bin-tag")
  , tar = require("./utils/tar")
  , sha = require("./utils/sha")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , fs = require("fs")

publish.usage = "npm publish <tarball>"
              + "\nnpm publish <folder>"
              + "\n\nPublishes '.' if no argument supplied"

publish.completion = function (opts, cb) {
  // publish can complete to a folder with a package.json
  // or a tarball, or a tarball url.
  // for now, not yet implemented.
  return cb()
}

function publish (args, isRetry, cb) {
  if (typeof cb !== "function") cb = isRetry, isRetry = false
  if (args.length === 0) args = ["."]
  log.verbose(args, "publish")
  npm.commands.cache.add(args[0], args[1], true, function (er, data) {
    if (er) return cb(er)
    log.silly(data, "publish")
    if (!data) return cb(new Error("no package.json file found"))
    delete data.modules
    if (data.private) return cb(new Error
      ("This package has been marked as private\n"
      +"Remove the 'private' field from the package.json to publish it."))

    // pre-build
    preBuild(data, binTag(), function (er, tb) {
      if (er) return cb(er)
      return regPublish(data, tb, isRetry, args, cb)
    })
  })
}

function preBuild (data, bt, cb) {
  if (!bt) return cb(data, null, cb)
  // unpack to cache/n/v/build
  // build there
  // pack to cache/package-<bt>.tgz
  var cf = path.resolve(npm.cache, data.name, data.version)
  var pb = path.resolve(cf, "build")
    , tb = path.resolve(cf, "package-"+bt+".tgz")

  log.warn("about to cache unpack")
  npm.commands.cache.unpack(data.name, data.version, pb, function (er) {
    log.warn("back from cache unpack")
    if (er) return cb(er)
    npm.commands.build([pb], function (er) {
      log.info(data._id, "prebuild done")
      // build failure just means that we can't prebuild
      if (er) {
        log.warn(er.message, "prebuild failed "+bt)
        return cb()
      }
      // now strip the preinstall/install scripts
      // they've already been run.
      var pbj = path.resolve(pb, "package.json")
      readJson(pbj, function (er, pbo) {
        if (er) return cb(er)
        if (pbo.scripts) {
          delete pbo.scripts.preinstall
          delete pbo.scripts.install
          delete pbo.scripts.postinstall
        }
        pbo.prebuilt = bt
        fs.writeFile(pbj, JSON.stringify(pbo), "utf8", function (er) {
          if (er) return cb(er)
          tar.pack(tb, pb, pbo, false, function (er) {
            if (er) return cb(er)
            // try to validate the shasum, too
            sha.get(tb, function (er, shasum) {
              if (er) return cb(er)
              // binary distribution requires shasum checking.
              if (!shasum) return cb()
              data.dist.bin = data.dist.bin || {}
              data.dist.bin[bt] = data.dist.bin[bt] || {}
              data.dist.bin[bt].shasum = shasum
              return cb(null, tb)
            })
          })
        })
      })
    })
  })
}

function regPublish (data, prebuilt, isRetry, args, cb) {
  registry.publish(data, prebuilt, function (er) {
    if (er && er.errno === npm.EPUBLISHCONFLICT
        && npm.config.get("force") && !isRetry) {
      log.warn("Forced publish over "+data._id, "publish")
      return npm.commands.unpublish([data._id], function (er) {
        // ignore errors.  Use the force.  Reach out with your feelings.
        publish(args, true, cb)
      })
    }
    cb(er)
  })
}
