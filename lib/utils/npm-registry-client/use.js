
module.exports = use

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

function use (package, usingValue, cb) {
  var registry = reg()
  if (registry instanceof Error) return cb(registry)
  
  var users = {}
  users[new Buffer(npm.config.get("_auth"), 'base64').toString().split(':')[0]] = usingValue

  var fullData =
    { _id : package
    , name : package
    , users: users
    }

  var dataURI = encodeURIComponent(package)

  GET(package, function (er, fullData) {
    if (er) return cb(er)

    fullData = {
      users: users
    , _id: fullData._id
    , _rev: fullData._rev
    }
    return PUT(dataURI, fullData, function (er) {
      cb(er)
    })
  })
}
