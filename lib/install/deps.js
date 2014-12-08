"use strict"
var fetchPackageMetadata = require("../fetch-package-metadata.js")
var semver = require("semver")
var asyncMap = require("slide").asyncMap
var path = require("path")
var addParentToErrors = require("./add-parent-to-errors.js")

var loadArgs = exports.loadArgs = function (args, tree, log, cb) {
  asyncMap( args, function (spec, amcb) {
    addChild(spec, tree, log.newGroup("loadArgs"), asCbWithCb(loadDeps, amcb))
  }, cb)
}

// Chains on to a callback a call to one of the dependency loaders below
function asCbWithCb(depLoader,cb) {
  return function (er, child, log) {
    if (er) return cb(er)
    depLoader(child, log, cb)
  }
}

var loadDeps = exports.loadDeps = function (tree, log, cb) {
  if (!tree || !tree.package.dependencies) return cb()
  asyncMap(Object.keys(tree.package.dependencies), function(dep, amcb) {
    var version = tree.package.dependencies[dep]
    if (   tree.package.optionalDependencies
        && tree.package.optionalDependencies[dep]) {
      amcb = warnOnError(log, amcb)
    }
    addChild(dep + "@" + version, tree, log.newGroup("loadDep:"+dep), asCbWithCb(loadDeps, amcb))
  }, cb)
}

var loadDevDeps = exports.loadDevDeps = function (tree, log, cb) {
  if (!tree || !tree.package.devDependencies) return cb()
  asyncMap(Object.keys(tree.package.devDependencies), function(dep, amcb) {
    if (tree.package.dependencies && tree.package.dependencies[dep]) return amcb()
    var version = tree.package.devDependencies[dep];
    addChild(dep + "@" + version, tree, log.newGroup("loadDevDep:"+dep), asCbWithCb(loadDeps,amcb))
  }, cb)
}

function warnOnError(log, cb) {
  return function (er, result) {
    if (er) {
      log.warn("install", "Couldn't install optional dependency:", er.message)
      log.verbose("install", er.stack)
    }
    cb(null, result)
  }
}

function addChild(spec, tree, log, cb) {
  cb = addParentToErrors(tree, cb)
  fetchPackageMetadata(spec, tree.path, log.newItem("fetchMetadata"), function (er, pkg) {
    if (er) return cb(er)
    var version = pkg.requested.spec
                ? pkg.requested.spec
                : pkg.version
    var child
    if (child = requirementExists(tree, pkg.name, version)) {
      if (!child.package.requested) {
        if (semver.satisfies(child.package.version, pkg.requested.spec)) {
          child.package.requested = pkg.requested
        }
        else {
          child.package.requested =
            { spec: child.package.version
            , type: "version"
            }
        }
      }
      if (child.package.requested.spec != pkg.requested.spec) {
        child.package.requested.spec += " " + pkg.requested.spec
        child.package.requested.type = "range"
      }
      return cb()
    }
    else {
      child =
        { package:  pkg
        , path:     path.join(tree.path, "node_modules", pkg.name)
        , realpath: path.resolve(tree.realpath, "node_modules", pkg.name)
        , children: []
        }
      tree.children.push(child)
      child.parent = tree
      cb(null,child, log)
    }
  })
}

function requirementExists(tree, name, version) {
  var matcher = function(child){
    return child.package.name == name
        && semver.satisfies(child.package.version, version)
  }
  if (matcher(tree)) return tree
  var matches = tree.children.filter(matcher)
  if (matches.length) return matches[0]
  if (!tree.parent) return null
  return requirementExists(tree.parent, name, version)
}

