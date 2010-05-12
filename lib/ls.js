
// show the installed versions of a package

module.exports = exports = ls

var npm = require("../npm")
  , log = require("./utils/log")
  , readInstalled = require("./utils/read-installed")
  , registry = require("./utils/registry")
  , semver = require("./utils/semver")

function ls (args, cb) {
  readInstalled([], function (er, installed) {
    registry.get(function (er, remote) {
      var merged = merge(installed, remote)
        , pretty = prettify(merged)
        , stdout = process.stdout
      stdout.write(pretty)
      stdout.flush()
    })
  })
}
function strcmp (a, b) { return a > b ? 1 : -1 }
function prettify (data) {
  var pkgs = Object.keys(data).sort(strcmp)
    , attrs = []
    , names = []
    , pretty = []
    , maxNameLen = 0
  pkgs.forEach(function (name) {
    var pkg = data[name]
    Object.keys(pkg).sort(semver.compare).forEach(function (v) {
      var ver = pkg[v]
        , p = []
      ver.tags = ver.tags.length === 0
               ? ""
               : ("@tag=" + ver.tags.join(" @tag="))
      for (var i in ver) if (ver[i]) {
        p.push((typeof ver[i] === "string") ? ver[i] : "@" + i)
      }
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
  return pretty.join("\n")
}
function merge (installed, remote) {
  var merged = {}
  // first, just copy the installed stuff
  for (var p in installed) {
    merged[p] = {}
    for (var v in installed[p]) {
      merged[p][v] = { installed : true, tags : [] }
      for (var s in installed[p][v]) {
        merged[p][v][s] = installed[p][v][s]
      }
    }
  }
  // now merge in the remote stuff.
  for (var p in remote) {
    merged[p] = merged[p] || {}
    for (var v in remote[p].versions) {
      merged[p][v] = merged[p][v] || {}
      merged[p][v].remote = true
      merged[p][v].stable = (remote[p]["dist-tags"].stable === v)
      merged[p][v].tags = []
      Object.keys(remote[p]["dist-tags"]).forEach(function (tag) {
        if (remote[p]["dist-tags"][tag] === v) merged[p][v].tags.push(tag)
      })
    }
  }
  return merged
}
