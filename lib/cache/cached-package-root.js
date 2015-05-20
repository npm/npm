var assert = require("assert")
var resolve = require("path").resolve
var caseUniquify = require("case-uniquify")

var npm = require("../npm.js")

module.exports = getCacheRoot

function getCacheRoot (data) {
  assert(data, "must pass package metadata")
  assert(data.name, "package metadata must include name")
  assert(data.version, "package metadata must include version")

  var name = caseUniquify(data.name)

  return resolve(npm.cache, name, data.version)
}
