
module.exports = set;
function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val;
  obj[key] = val;
  if (val && val.version && key.indexOf("-"+val.version) !== -1) {
    key = key.replace("-"+val.version, "");
    var reg = get(obj, key) || {};
    set(reg, val.version, val);
    set(obj, key, reg);
    reg._versions = get(reg, "_versions") || [];
    reg._versions.push(val.version);
  }
}
