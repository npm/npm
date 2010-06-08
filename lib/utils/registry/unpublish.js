
// fetch the data
// modify to remove the version in question
// If no versions remaining, then DELETE
// else, PUT the modified data
// delete the tarball

module.exports = unpublish

var request = require("./request")
  , log = require("../log")
  , get = require("./get")
  , semver = require("../semver")

function unpublish (name, ver, cb) {
  if (!cb) cb = ver, ver = null
  if (!cb) throw new Error(
    "Not enough arguments for registry unpublish")
  get(name, function (er, data) {
    if (er) return log(name+" not published", "unpublish", cb)
    // remove all if no version specified
    if (!ver) return request("DELETE", name+'/-rev/'+data._rev, cb)
    if (!data.versions.hasOwnProperty(ver)) return log(
      name+"@"+ver+" not published", "unpublish", cb)
    delete data.versions[ver]
    for (var tag in data["dist-tags"]) {
      if (data["dist-tags"][tag] === ver) delete data["dist-tags"][tag]
    }
    data["dist-tags"].latest =
      Object.getOwnPropertyNames(data.versions).sort(semver.compare).pop()
    var rev = data._rev
    delete data._revisions
    delete data._attachments
    // log(data._rev, "rev")
    request.PUT(name+"/-rev/"+rev, data,
      log.er(detacher(data, ver, cb), "Failed to update the data"))
  })
}
function detacher (data, version, cb) { return function (er) {
  if (er) return cb(er)
  get(data.name, function (er, data) {
    if (er) return cb(er)
    log(data, "data")
  
    // delete the attachment
    var attURI = encodeURIComponent(data.name)
               + "/-/"
               + encodeURIComponent(data.name)
               + "-"
               + encodeURIComponent(version)
               + ".tgz"
               + "/-rev/"
               + encodeURIComponent(data._rev)
    request("DELETE", attURI, log.er(cb, "Failed to delete attachment"))
  })
}}