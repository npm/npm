
module.exports = star

var request = require("./request.js")
  , GET = request.GET
  , PUT = request.PUT
  , log = require("npmlog")
  , npm = require("../../npm.js")

function star (package, starred, cb) {
  var users = {}

  GET(package, function (er, fullData) {
    if (er) return cb(er)

    fullData = { _id: fullData._id
               , _rev: fullData._rev
               , users: fullData.users || {} }

    if (starred) {
      log.info("starring", fullData._id)
      fullData.users[npm.config.get("username")] = true
      log.verbose("starring", fullData)
    } else {
      delete fullData.users[npm.config.get("username")]
      log.info("unstarring", fullData._id)
      log.verbose("unstarring", fullData)
    }

    return PUT(package, fullData, cb)
  })
}
