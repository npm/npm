
module.exports = set
var get = require("./get")
  , processJson = require("./read-json").processJson
function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val
  obj[key] = val
  if (!val) return
  // if it's a package set, then assign all the versions.
  if (val.versions) return Object.keys(val.versions).forEach(function (v) {
    if (typeof val.versions[v] !== "object") return
    set(obj, key+"@"+v, val.versions[v])
  })
  if (key === val.name+"-"+val.version || key === val.name+"@"+val.version) {
    processJson(val)
    var reg = get(obj, val.name) || {}
    set(obj, key, reg)
    reg.versions = get(reg, "versions") || {}
    if (!get(reg.versions, val.version)) set(reg.versions, val.version, val)
  }
}
