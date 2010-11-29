
// show the installed versions of a package

module.exports = exports = ls

var npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , registry = require("./utils/registry")
  , semver = require("./utils/semver")
  , output = require("./utils/output")
  , log = require("./utils/log")

ls.usage = "npm ls [some search terms ...]"

function ls (args, cb_) {
  var listopts = npm.config.get("listopts")
  if (typeof listopts !== "string") listopts = ""
  listopts = listopts.trim().split(/\s+/)
  readInstalled([], function (er, installed) {
    if (er) return cb_(er)
    // use up to 10 minute stale cache.
    registry.get("/", null, 600, function (er, remote) {
      if (er) remote = {}
      var info = merge(installed, remote)
        , pretty = prettify(info, args, listopts)
      function cb () { cb_(null, info) }
      output.write(npm.config.get("outfd"), pretty, cb)
    })
  })
}
function strcmp (a, b) { return a > b ? 1 : -1 }
function prettify (data, args, extraFilters) {
  var pkgs = Object.keys(data).sort(strcmp)
    , attrs = []
    , names = []
    , pretty = []
    , beginAttrList = 28
  pkgs.forEach(function (name) {
    var pkg = data[name]
    if (pkg.url && (!pkg.versions || !Object.keys(pkg.versions).length)) {
      names.push(name)
      attrs.push(pkg.maintainers.map(function (m) {
        return "=" + m.name
      }).concat("<"+pkg.url+">").join(" "))
    }
    Object.keys(pkg.versions).sort(semver.compare).forEach(function (v) {
      var ver = pkg.versions[v]
        , p = []
      ver.tags = ver.tags.length === 0
               ? ""
               : (ver.tags.join(" "))
      for (var i in ver) if (ver[i]) {
        p.push((typeof ver[i] === "string") ? ver[i] : i)
      }
      if (pkg.maintainers) pkg.maintainers.forEach(function (m) {
        p.push('='+m.name)
      })
      names.push(name + "@" + v)
      attrs.push(p.sort(strcmp).join(" "))
    })
  })
  for (var n = 0, l = names.length; n < l; n ++) {
    pretty.push({name:names[n], attrs:attrs[n]})
  }
  var colors = [36, 32, 33, 31, 35 ]
    , c = 0
    , l = colors.length
  var maxNameLen = 0
  if (args) pretty = pretty.filter(function (line) {
    var keep = true
    args.concat(extraFilters).forEach(function (arg) {
      keep = keep && (line.name.match(arg) || line.attrs.match(arg))
    })
    return keep
  })
  var space = "                       "
  pretty.forEach(function (line) {
    maxNameLen = Math.min(Math.max(maxNameLen, line.name.length), space.length)
  })
  maxNameLen += 2

  // now turn each line obj into a single line, with only as much ws as necessary.
  pretty = pretty.map(function (line) {
    var addSpace = maxNameLen - line.name.length
    return line.name + (space.substr(0, addSpace) || "") + " " + line.attrs
  })

  if (args) args.forEach(function (arg) {
    pretty = pretty.map(function (line) {
      return line.split(arg).join("\033["+colors[c]+"m" + arg + "\033[m")
    })
    c = (c + 1) % l
  })
  if (!pretty.length) pretty = ["Nothing found"]
  pretty.push("")
  return pretty.join("\n")
}
function merge (installed, remote) {
  var merged = {}
  // first, just copy the installed stuff
  for (var p in installed) {
    merged[p] = {versions:{}}
    for (var v in installed[p]) {
      merged[p].versions[v] = { installed : true, tags : [] }
      for (var s in installed[p][v]) {
        merged[p].versions[v][s] = installed[p][v][s]
      }
    }
  }
  // now merge in the remote stuff.
  for (var p in remote) {
    merged[p] = merged[p] || {versions:{}}
    for (var d in remote[p]) if (!merged[p].hasOwnProperty(d)) {
      merged[p][d] = remote[p][d]
    }
    for (var v in remote[p].versions) {
      merged[p].versions[v] = merged[p].versions[v] || {}
      merged[p].versions[v].remote = true
      merged[p].versions[v].tags = []
      Object.keys(remote[p]["dist-tags"]).forEach(function (tag) {
        if (remote[p]["dist-tags"][tag] === v) merged[p].versions[v].tags.push(tag)
      })
      // merged[p][v].__proto__ = remote[p][v]
      // Object.keys(remote[p][v]).forEach(function (i) {
      //   merged[p][v][i] = merged[p][v][i] || remote[p][v][i]
      // })
    }
  }
  return merged
}
