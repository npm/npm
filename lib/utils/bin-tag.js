module.exports = binTag

var binTagMemo
  , os = require("os")
  , npm = require("../../npm")
  , semver = require("semver")

function binTag () {
  if (binTagMemo || binTagMemo === null) return binTagMemo
  var nv = semver.parse(npm.config.get("node-version"))
    , platform = process.platform
    , release = os.release()
  if (!nv) return binTagMemo = null // weird?
  nv = !(+nv[2] % 2) ? (nv[1] + "." + nv[2]) : nv[0]
  return binTagMemo = nv + "-" + platform + "-" + release
}
