
module.exports = set
var get = require("./get")
  , processJson = require("./read-json").processJson
function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val
  obj[key] = val
  if (val && val.version && key.indexOf("-"+val.version) !== -1) {
    processJson(val)
    key = key.replace("-"+val.version, "")
    var reg = get(obj, key) || {}
    set(obj, key, reg)
    reg.versions = get(reg, "versions") || {}
    if (!get(reg.versions, val.version)) set(reg.versions, val.version, val)
  } else if (val && val.versions) {
    for (var v in val.versions) set(obj, key+"-"+v, val.versions[v])
  }
}
