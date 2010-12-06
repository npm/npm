
// walks a set of directories recursively, and returns
// the list of files that match the filter, if one is
// provided.

module.exports = find
var fs = require("./graceful-fs")
  , asyncMap = require("./async-map")
  , path = require("path")

function find (dir, filter, depth, cb) {
  if (typeof cb !== "function") cb = depth, depth = Infinity
  if (typeof cb !== "function") cb = filter, filter = null
  if (filter instanceof RegExp) filter = reFilter(filter)
  if (typeof filter === "string") filter = strFilter(filter)
  if (!Array.isArray(dir)) dir = [dir]
  asyncMap(dir, findDir(filter, depth), cb)
}
function findDir (filter, depth) { return function (dir, cb) {
  fs.stat(dir, function (er, stats) {
    // don't include missing files, but don't abort either
    if (er) return cb()
    if (!stats.isDirectory()) return findFile(dir, filter, depth)("", cb)
    if (filter && !filter(dir)) return cb(er, [])
    if (depth <= 0) return cb(null, [dir+"/"])
    cb = (function (cb) { return function (er, f) {
      cb(er, [dir+"/"].concat(f))
    }})(cb)
    fs.readdir(dir, function (er, files) {
      if (er) return cb(er)
      asyncMap(files, findFile(dir, filter, depth - 1), cb)
    })
  })
}}
function findFile (dir, filter, depth) { return function (f, cb) {
  f = path.join(dir, f)
  fs.stat(f, function (er, s) {
    // don't include missing files, but don't abort either
    if (er) return cb()
    if (s.isDirectory()) return find(f, filter, depth, cb)
    if (!filter || filter(f)) cb(null, f)
    else cb()
  })
}}
function reFilter (re) { return function (f) {
  return f.match(re)
}}
function strFilter (s) { return function (f) {
  return f.indexOf(s) === 0
}}
