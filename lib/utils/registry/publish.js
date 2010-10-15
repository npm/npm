

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

function publish (data, registry, cb) {
  // add the dist-url to the data, pointing at the tarball.
  // if the {name} isn't there, then create it.
  // if the {version} is already there, then fail.
  // then:
  // PUT the data to {config.registry}/{data.name}/{data.version}
  try { reg() }
  catch (ex) { return cb(ex) }

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
  data._id = data.name+"@"+data.version
  var attURI = encodeURIComponent(data.name)
             + "/-/"
             + encodeURIComponent(data.name)
             + "-"
             + encodeURIComponent(data.version)
             + ".tgz"
  data.dist = { "tarball" : url.resolve(registry, attURI) }
  data.dist.tarball = data.dist.tarball.replace(/^https:\/\//, 'http://')

  // first try to just PUT the whole fullData, and this will fail if it's
  // already there, because it'll be lacking a _rev, so couch'll bounce it.
  PUT(encodeURIComponent(data.name), fullData, function (er, parsed, json, response) {
    // get the rev and then upload the attachment
    // a 409 is expected here, if this is a new version of an existing package.
    if (er
        && !(response && response.statusCode === 409)
        && !( parsed
            && parsed.reason === "must supply latest _rev to update existing package"
            )
    ) {
      return log.er(cb, "Failed PUT response "+(response && response.statusCode))(er)
    }
    var dataURI = encodeURIComponent(data.name)+"/"+encodeURIComponent(data.version)
    PUT(dataURI, data, function (er) {
      if (er) {
        if (er.message.indexOf("conflict Document update conflict.") === 0) {
          log.error( "Cannot publish over existing version.\n"
                   + "Bump the 'version' field, or\n"
                   + "    npm unpublish '"+data.name+"'@'"+data.version+"'\n"
                   + "and try again"
                   , "publish fail"
                   )
          return cb(new Error("publish fail"))
        }
        return log.er(cb, "Error sending version data")(er)
      }
      GET(encodeURIComponent(data.name), function (er, d) {
        if (er) return cb(er)
        var rev = d && ("-rev/"+d._rev)
          , tarball = path.join(npm.cache, data.name, data.version, "package.tgz")
        log.verbose(tarball, "tarball")
        attURI += "/" + rev
        upload(attURI, tarball, function (er) {
          log("uploaded", "publish")
          if (er) log.error("Couldn't send tarball", "publish fail")
          rollbackFailure(data, cb)(er)
        })
      })
    })
  })
}

function rollbackFailure (data, cb) { return function (er) {
  if (!er) return cb()
  npm.ROLLBACK = true
  log.error(er, "publish failed")
  log("rollback", "publish failed")
  log.warn([data.name, data.version, data._id], "about to unpublish")
  npm.commands.unpublish([data.name+"@"+data.version], function (er_) {
    if (er_) {
      log.error(er_, "rollback failed")
      log.error("Invalid data in registry! Please report this.", "rollback failed")
    } else log("rolled back", "publish failed")
    cb(er)
  })
}}
