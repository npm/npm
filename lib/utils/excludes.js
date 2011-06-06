// build up a set of exclude lists in order of precedence:
// [ ["!foo", "bar"]
// , ["foo", "!bar"] ]
// being *included* will override a previous exclusion,
// and being excluded will override a previous inclusion.
//
// Each time the tar file-list generator thingie enters a new directory,
// it calls "addIgnoreFile(dir, list, cb)".  If an ignore file is found,
// then it is added to the list and the cb() is called with an
// child of the original list, so that we don't have
// to worry about popping it off at the right time, since other
// directories will continue to use the original parent list.
//
// If no ignore file is found, then the original list is returned.
//
// To start off with, ~/.{npm,git}ignore is added, as is
// prefix/{npm,git}ignore, effectively treated as if they were in the
// base package directory.

exports.addIgnoreFile = addIgnoreFile
exports.readIgnoreFile = readIgnoreFile
exports.parseIgnoreFile = parseIgnoreFile
exports.test = test
exports.filter = filter

var path = require("path")
  , fs = require("./graceful-fs")
  , minimatch = require("./minimatch")
  , relativize = require("./relativize")
  , log = require("./log")

// todo: memoize

// read an ignore file, or fall back to the
// "gitBase" file in the same directory.
function readIgnoreFile (file, gitBase, cb) {
  if (!file) return cb(null, "")
  fs.readFile(file, function (er, data) {
    if (!er) return cb(null, data || "")
    var gitFile = path.resolve(path.dirname(file), gitBase)
    fs.readFile(gitFile, function (er, data) {
      return cb(null, data || "")
    })
  })
}

// read a file, and then return the list of patterns
function parseIgnoreFile (file, gitBase, dir, cb) {
  readIgnoreFile(file, gitBase, function (er, data) {
    data = data ? data.toString("utf8") : ""

    data = data.split(/[\r\n]+/).map(function (p) {
      return p.trim()
    }).filter(function (p) {
      return p.length && p.charAt(0) !== "#"
    })
    data.dir = dir
    return cb(er, data)
  })
}

// add an ignore file to an existing list which can
// then be passed to the test() function. If the ignore
// file doesn't exist, then the list is unmodified. If
// it is, then a concat-child of the original is returned,
// so that this is suitable for walking a directory tree.
function addIgnoreFile (file, gitBase, list, dir, cb) {
  if (typeof cb !== "function") cb = dir, dir = path.dirname(file)
  if (typeof cb !== "function") cb = list, list = []
  parseIgnoreFile(file, gitBase, dir, function (er, data) {
    if (!er && data) {
      // package.json "files" array trumps everything
      // Make sure it's always last.
      if (list.length && list[list.length-1].packageFiles) {
        list = list.concat([data, list.pop()])
      } else {
        list = list.concat([data])
      }
    }
    cb(er, list)
  })
}


// no IO
// loop through the lists created in the functions above, and test to
// see if a file should be included or not, given those exclude lists.
function test (file, excludeList) {
  if (path.basename(file) === "package.json") return true
  //log.warn(file, "test file")
  //log.warn(excludeList, "test list")
  var incRe = /^\!(\!\!)*/
    , excluded = false
  for (var i = 0, l = excludeList.length; i < l; i ++) {
    var excludes = excludeList[i]
      , dir = excludes.dir

    // chop the filename down to be relative to excludeDir
    var rf = relativize(file, dir, true)
    rf = rf.replace(/^\.\//, "")

    for (var ii = 0, ll = excludes.length; ii < ll; ii ++) {
      //log.warn(JSON.stringify(excludes[ii]), "ex")
      var ex = excludes[ii].replace(/^\.\//, "")
        , inc = ex.match(incRe)

      // if this is not an inclusion attempt, and someone else
      // excluded it, then just continue, because there's nothing
      // that can be done here to change the exclusion.
      if (!inc && excluded) continue

      // if it matches the pattern, then it should be excluded.
      excluded = minimatch(rf, ex)
    }
  }
  // true if it *should* be included
  return !excluded
}

// returns a function suitable for Array#filter
function filter (dir, list) { return function (file) {
  file = file.trim()
  return file && test(path.resolve(dir, file), list)
}}
