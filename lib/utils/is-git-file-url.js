
module.exports = isGitFileUrl

var url = require("url")

function isGitFileUrl (s) {
  if (url.parse(s).protocol === "git+file:")
    return true
}
