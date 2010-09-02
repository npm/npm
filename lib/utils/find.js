
// walks a set of directories recursively, and returns
// the list of files that match the filter, if one is
// provided.

module.exports = find
var fs = require("./graceful-fs")
  , asyncMap = require("./async-map")
  , path = require("path")

function find (dir, filter, cb) {
  if (!cb) cb = filter, filter = null
  if (filter instanceof RegExp) filter = reFilter(filter)
  if (!Array.isArray(dir)) dir = [dir]
  asyncMap(dir, findDir(filter), cb)
}
function findDir (filter) { return function (dir, cb) {
  fs.stat(dir, function (er, stats) {
    // don't include missing files, but don't abort either
    if (er) return cb()
    if (!stats.isDirectory()) return cb(new Error(
      "Not a dir, can't walk:"+dir))
    fs.readdir(dir, function (er, files) {
      if (er) return cb(er)
      asyncMap(files, findFile(dir, filter), cb)
    })
  })
}}
function findFile (dir, filter) { return function (f, cb) {
  f = path.join(dir, f)
  fs.stat(f, function (er, s) {
    // don't include missing files, but don't abort either
    if (er) return cb()
    if (s.isDirectory()) return find(f, cb)
    if (!filter || filter(f)) cb(null, f)
    else cb()
  })
}}
function reFilter (re) { return function (f) {
  return f.match(re)
}}
