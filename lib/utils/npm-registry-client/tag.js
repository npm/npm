
module.exports = tag

var PUT = require("./request").PUT

function tag (project, version, tag, cb) {
  PUT(project+"/"+tag, version, cb)
}
