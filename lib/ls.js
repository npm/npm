
// show the installed versions of a package

module.exports = exports = ls

var npm = require("../npm")
  , log = require("./utils/log")
  , readInstalled = require("./utils/read-installed")
  , registry = require("./utils/registry")
  , semver = require("./utils/semver")

ls.usage = "npm ls [some search terms ...]"

function ls (args, cb) {
  readInstalled([], function (er, installed) {
    if (er) return cb(er)
    registry.get(function (er, remote) {
      if (er) remote = {}
      var pretty = prettify(merge(installed, remote), args)
        , stdout = process.stdout
      stdout.write(pretty)
      if (stdout.flush()) cb()
      else stdout.on("drain", cb)
    })
  })
}
function strcmp (a, b) { return a > b ? 1 : -1 }
function prettify (data, args) {
  var pkgs = Object.keys(data).sort(strcmp)
    , attrs = []
    , names = []
    , pretty = []
    , maxNameLen = 0
  pkgs.forEach(function (name) {
    var pkg = data[name]
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
      maxNameLen = Math.max(maxNameLen, (name + "@" + v).length)
      attrs.push(p.sort(strcmp).join(" "))
    })
  })
  var space = "                                   "
  for (var n = 0, l = names.length; n < l; n ++) {
    names[n] += space.substr(0, maxNameLen - names[n].length)
    pretty.push(names[n] + " " + attrs[n])
  }
  var doColor
    , colors = [36, 32, 33, 31, 35 ]
    , c = 0
    , l = colors.length
  // don't color if it's piping to some other process.
  try {
    var stdio = require("stdio")
    doColor = stdio.isStdoutATTY()
  } catch (ex) {
    doColor = true
  }
  if (args) args.forEach(function (arg) {
    pretty = pretty.filter(function (line) { return line.match(arg) })
    if (doColor) {
      pretty = pretty.map(function (line) {
        return line.split(arg).join("\033["+colors[c]+"m" + arg + "\033[m")
      })
      c = (c + 1) % l
    }
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
