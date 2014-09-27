"use strict"
var fs = require("fs")
var path = require("path")
var dz = require("dezalgo")
var npa = require("npm-package-arg")

module.exports = function (spec, where, cb) {
  if (where instanceof Function) cb = where, where = null
  if (where == null) where = "."
  cb = dz(cb)
  try {
    var dep = npa(spec)
  }
  catch (e) {
    return cb(e)
  }
  var specpath = path.resolve(where, dep.type == "local" ? dep.spec : spec)
  fs.stat(specpath, function (er, s) {
    if (er) return finalize()
    if (!s.isDirectory()) return finalize("local")
    fs.stat(path.join(specpath, "package.json"), function (er) {
      finalize(er ? null : "directory")
    })
  })
  function finalize(type) {
    if (type != null) dep.type = type
    if (dep.type == "local" || dep.type == "directory") dep.spec = specpath
    cb(null, dep)
  }
}
