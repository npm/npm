
module.exports = get

var GET = require("./request").GET

function get (project, version, cb) {
  if (!cb) cb = version, version = null
  if (!cb) cb = project, project = null
  if (!cb) throw new Error("No callback provided to registry.get")
  var uri = []
  uri.push(project || "")
  if (version) uri.push(version)
  GET(uri.join("/"), cb)
}
