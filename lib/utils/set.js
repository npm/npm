
module.exports = set
var get = require("./get")
function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val
  obj[key] = val
  if (val && val.version && key.indexOf("-"+val.version) !== -1) {
    key = key.replace("-"+val.version, "")
    var reg = get(obj, key) || {}
    set(obj, key, reg)
    reg.versions = get(reg, "versions") || {}
    if (!get(reg.versions, val.version)) set(reg.versions, val.version, val)
  }
}
