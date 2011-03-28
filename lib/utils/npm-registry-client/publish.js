
module.exports = publish

var request = require("./request")
  , GET = request.GET
  , PUT = request.PUT
  , DELETE = request.DELETE
  , reg = request.reg
  , upload = request.upload
  , log = require("../log")
  , path = require("path")
  , npm = require("../../../npm")
  , url = require("url")
  , binTag = require("../bin-tag")

function publish (data, prebuilt, cb) {
  // add the dist-url to the data, pointing at the tarball.
  // if the {name} isn't there, then create it.
  // if the {version} is already there, then fail.
  // then:
  // PUT the data to {config.registry}/{data.name}/{data.version}
  var registry = reg()
  if (registry instanceof Error) return cb(registry)

  var fullData =
    { _id : data.name
    , name : data.name
    , description : data.description
    , "dist-tags" : {}
    , versions : {}
    , maintainers :
      [ { name : npm.config.get("username")
        , email : npm.config.get("email")
        }
      ]
    }

  var tbName = data.name + "-" + data.version + ".tgz"
    , bt = binTag()
    , pbName = data.name + "-" + data.version + "-" + bt + ".tgz"
    , tbURI = data.name + "/-/" + tbName
    , pbURI = data.name + "/-/" + pbName

  data._id = data.name+"@"+data.version
  data.dist = data.dist || {}
  data.dist.tarball = url.resolve(registry, tbURI)
                         .replace(/^https:\/\//, "http://")

  if (prebuilt && bt) {
    data.dist.bin[bt] = data.dist.bin[bt] || {}
    data.dist.bin[bt].tarball = url.resolve(registry, pbURI)
                                   .replace(/^https:\/\//, "http://")
  }




  // first try to just PUT the whole fullData, and this will fail if it's
  // already there, because it'll be lacking a _rev, so couch'll bounce it.
  PUT(encodeURIComponent(data.name), fullData,
      function (er, parsed, json, response) {
    // get the rev and then upload the attachment
    // a 409 is expected here, if this is a new version of an existing package.
    if (er
        && !(response && response.statusCode === 409)
        && !( parsed
            && parsed.reason ===
              "must supply latest _rev to update existing package" )) {
      return log.er(cb, "Failed PUT response "
                   +(response && response.statusCode))(er)
    }
    var dataURI = encodeURIComponent(data.name)
                + "/" + encodeURIComponent(data.version)

    var tag = data.tag || npm.config.get("tag")
    if (npm.config.get("pre")) dataURI += "/-pre/true"
    else if (tag) dataURI += "/-tag/" + tag
    else dataURI += "/-tag/latest"

    // let's see what verions are already published.
    // could be that we just need to update the bin dist values.
    GET(data.name, function (er, fullData) {
      if (er) return cb(er)

      var exists = fullData.versions && fullData.versions[data.version]
      if (exists) {
        log(exists._id, "Already published")
        var ebin = exists.dist.bin || {}
          , nbin = data.dist.bin || {}
          , needs = Object.keys(nbin).filter(function (bt) {
              return !ebin.hasOwnProperty(bt)
            })
        log.verbose(needs, "uploading bin dists")
        if (!needs.length) return cb(conflictError(data._id))
        // attach the needed bindists, upload the new metadata
        exists.dist.bin = ebin
        needs.forEach(function (bt) { exists.dist.bin[bt] = nbin[bt] })
        return PUT(dataURI + "/-rev/" + fullData._rev, exists, function (er) {
          if (er) return cb(er)
          attach(data.name, prebuilt, pbName, cb)
        })
      }

      PUT(dataURI, data, function (er) {
        if (er) {
          if (er.message.indexOf("conflict Document update conflict.") === 0) {
            return cb(conflictError(data._id))
          }
          return log.er(cb, "Error sending version data")(er)
        }

        var c = path.resolve(npm.cache, data.name, data.version)
          , tb = path.resolve(c, "package.tgz")

        cb = rollbackFailure(data, cb)

        attach(data.name, tb, tbName, function (er) {
          if (er || !prebuilt) return cb(er)
          attach(data.name, prebuilt, pbName, cb)
        })
      })
    })
  })
}

function conflictError (pkgid) {
  var e = new Error("publish fail")
  e.errno = npm.EPUBLISHCONFLICT
  e.pkgid = pkgid
  return e
}

function attach (doc, file, filename, cb) {
  doc = encodeURIComponent(doc)
  GET(doc, function (er, d) {
    if (er) return cb(er)
    if (!d) return cb(new Error(
      "Attempting to upload to invalid doc "+doc))
    var rev = "-rev/"+d._rev
      , attURI = doc + "/-/" + encodeURIComponent(filename) + "/" + rev
    upload(attURI, file, cb)
  })
}

function rollbackFailure (data, cb) { return function (er) {
  if (!er) return cb()
  npm.ROLLBACK = true
  log.error(er, "publish failed")
  log("rollback", "publish failed")
  npm.commands.unpublish([data.name+"@"+data.version], function (er_) {
    if (er_) {
      log.error(er_, "rollback failed")
      log.error("Invalid data in registry! Please report this.", "rollback failed")
    } else log("rolled back", "publish failed")
    cb(er)
  })
}}
