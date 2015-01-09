"use strict"
var semver = require("semver")
var asyncMap = require("slide").asyncMap
var chain = require("slide").chain
var path = require("path")
var union = require("lodash.union")
var without = require("lodash.without")
var iferr = require("iferr")
var npa = require("npm-package-arg")
var fetchPackageMetadata = require("../fetch-package-metadata.js")
var andAddParentToErrors = require("./and-add-parent-to-errors.js")
var addShrinkwrap = require("../fetch-package-metadata.js").addShrinkwrap
var addBundled = require("../fetch-package-metadata.js").addBundled
var inflateShrinkwrap = require("./inflate-shrinkwrap.js")
var andFinishTracker = require("./and-finish-tracker.js")
var npm = require("../npm.js")

// The export functions in this module mutate a dependency tree, adding
// items to them.


// Add a list of args to tree's top level dependencies
exports.loadRequestedDeps = function (args, tree, saveToDependencies, log, next) {
  asyncMap(args, function (spec, done) {
    replaceDependency(spec, tree, log.newGroup("loadRequestedDeps"), iferr(done, function (child, tracker) {
      if (npm.config.get("global")) {
        child.isGlobal = true
      }
      child.directlyRequested = true
      child.save = saveToDependencies

      // For things the user asked to instrall, that aren't a dependency (or
      // won't be when we're done), flag it as "depending" on the user
      // themselves, so we don't remove it as a dep that no longer exists
      if (!child.save && !tree.package.dependencies[child.package.name]) {
        child.package._requiredBy = union(without(child.package._requiredBy, "/"), ["#USER"])
      }
      done(null, child, tracker)
    }))
  }, andLoadDeps(andFinishTracker(log, next)))
}

exports.removeDeps = function (args, tree, saveToDependencies, log, next) {
  asyncMap(args, function (name, done) {
    tree.children = tree.children.filter(function(child) { return child.package.name !== name })
    done()
  }, andFinishTracker(log, next))
}

function andLoadDeps(next) {
  return function (er, children, logs) {
    if (!children) return next(er)
    var cmds = []
    for (var ii=0; ii < children.length; ++ii) {
      cmds.push([loadDeps, children[ii], logs[ii], false])
    }
    var sortedCmds = cmds.sort(function installOrder (aa, bb) {
      return aa[1].package.name.localeCompare(bb[1].package.name)
    })
    chain(sortedCmds, next)
  }
}

// Load any missing dependencies in the given tree
exports.loadDeps = loadDeps
function loadDeps (tree, log, installNewModules, next) {
  if (tree.loaded) return andFinishTracker.now(log, next)
  tree.loaded = true
  if (!tree.package.dependencies) tree.package.dependencies = {}
  asyncMap(Object.keys(tree.package.dependencies), function (dep, done) {
    var version = tree.package.dependencies[dep]
    if (   tree.package.optionalDependencies
        && tree.package.optionalDependencies[dep]) {
      done = andWarnOnError(log, done)
    }
    var spec = dep + "@" + version
    addDependency(spec, tree, log.newGroup("loadDep:"+dep), done)
  }, andLoadDeps(andFinishTracker(log, next)))
}

function andWarnOnError (log, next) {
  return function (er, result) {
    if (er) {
      log.warn("install", "Couldn't install optional dependency:", er.message)
      log.verbose("install", er.stack)
    }
    next(null, result)
  }
}

// Load development dependencies into the given tree
exports.loadDevDeps = function (tree, log, next) {
  if (!tree.package.devDependencies) return andFinishTracker.now(log, next)
  asyncMap(Object.keys(tree.package.devDependencies), function (dep, done) {
    // things defined as both dev dependencies and regular dependencies are treated
    // as the former
    if (tree.package.dependencies[dep]) return done()

    var spec = dep + "@" + tree.package.devDependencies[dep]
    var logGroup = log.newGroup("loadDevDep:"+dep)
    addDependency(spec, tree, logGroup, iferr(done, function (child, tracker) {
      child.devDependency = true
      done(child, tracker)
    }))
  }, andLoadDeps(andFinishTracker(next)))
}

exports.loadExtraneous = function (tree, log, next) {
  andLoadDeps(next)(null, tree.children, tree.children.map(function(){ return log }))
}

function replaceDependency (spec, tree, log, cb) {
  var next = andAddParentToErrors(tree, cb)
  fetchPackageMetadata(spec, tree.path, log.newItem("fetchMetadata"), iferr(next, function (pkg) {
    tree.children = tree.children.filter(function(child) {
      return child.package.name !== pkg.name
    })
    resolveRequirement(pkg, tree, log, next)
  }))
}

function addDependency (spec, tree, log, cb) {
  var next = andAddParentToErrors(tree, cb)
  fetchPackageMetadata(spec, tree.path, log.newItem("fetchMetadata"), iferr(next, function (pkg) {
    var child = findRequirement(tree, pkg.name, npa(spec))
    if (child) {
      resolveWithExistingModule(child, pkg, tree, log, next)
    }
    else {
      resolveRequirement(pkg, tree, log, next)
    }
  }))
}

function resolveWithExistingModule (child, pkg, tree, log, next) {
  if (!child.package._requested) {
    if (semver.satisfies(child.package.version, pkg._requested.spec)) {
      child.package._requested = pkg._requested
    }
    else {
      child.package._requested =
        { spec: child.package.version
        , type: "version"
        }
    }
  }
  if (child.package._requested.spec !== pkg._requested.spec) {
    child.package._requested.spec += " " + pkg._requested.spec
    child.package._requested.type = "range"
  }
  if (!child.package._requiredBy) child.package._requiredBy = [ "#EXISTING" ]
  child.package._requiredBy = union(child.package._requiredBy || [], [flatname(tree)])

  var current = tree.parent
  while (current && current !== child.parent) {
    // FIXME: phantomChildren doesn't actually belong in the package.json
    if (!current.package._phantomChildren) current.package._phantomChildren = {}
    current.package._phantomChildren[pkg.name] = child.package.version
    current = current.parent
  }

  if (!child.loaded && !pkg._shrinkwrap) {
    addShrinkwrap(pkg, iferr(next, function () {
      if (pkg._shrinkwrap && pkg._shrinkwrap.dependencies) {
        return inflateShrinkwrap(child, pkg._shrinkwrap.dependencies, next)
      }
      else {
        return next(null, child, log)
      }
    }))
  }
  else {
    return next(null, child, log)
  }
}

function pushUnique (obj, key, element) {
  if (!obj[key]) obj[key] = []
  if (without(obj[key], element).length===0) {
    obj[key].push(element)
  }
}

function flatname(tree) {
  if (!tree.parent) return "/"
  var name = flatname(tree.parent)
  if (name !== "/") name += "/"
  name += (tree.package.dist && tree.package.dist.shasum)
       || tree.package._id
       || (tree.package.name && tree.package.name + "@" + tree.package.version)
       || "TOP"
  return name
}

function resolveRequirement (pkg, tree, log, next) {
  pkg._from = pkg._requested.name + "@" + pkg._requested.spec
  addShrinkwrap(pkg, iferr(next, function () {
    addBundled(pkg, iferr(next, function () {

      var child = {
        package:  pkg,
        children: [],
        requires: []
        }

      child.parent = earliestInstallable(tree, tree, pkg) || tree
      child.parent.children.push(child)
      child.package._requiredBy = union(child.package._requiredBy || [], [flatname(tree)])

      var current = tree.parent
      while (current && current !== child.parent) {
        // FIXME: phantomChildren doesn't actually belong in the package.json
        if (!current.package._phantomChildren) current.package._phantomChildren = {}
        current.package._phantomChildren[pkg.name] = pkg.version
        current = current.parent
      }

      tree.requires = union(tree.requires || [], [child])

      pushUnique(tree, "requires", child)

      child.path = path.join(child.parent.path, "node_modules", pkg.name)
      child.realpath = path.resolve(child.parent.realpath, "node_modules", pkg.name)

      if (pkg.bundled) {
        child.children = pkg.bundled
        inflateBundled(child, child.children)
      }

      if (pkg._shrinkwrap && pkg._shrinkwrap.dependencies) {
        return inflateShrinkwrap(child, pkg._shrinkwrap.dependencies, function () {
          next(null, child, log)
        })
      }

      next(null, child, log)
    }))
  }))
}

function inflateBundled (parent, children) {
  children.forEach(function (child){
    child.fromBundle = true
    child.parent = parent
    child.path = path.join(parent.path, child.package.name)
    child.realpath = path.resolve(parent.path, child.package.name)
    inflateBundled(child, child.children)
  })
}

// Determine if a module requirement is already met by the tree at or above
// our current location in the tree.
function findRequirement (tree, name, requested) {
  var nameMatch = function (child) {
    return child.package.name === name
  }
  var versionMatch = function (child) {
    var childReq = child.package._requested
    if (childReq && childReq.type === requested.type && childReq.spec === requested.spec) return true
    if (requested.type !== "range" && requested.type !== "version") return false
    return semver.satisfies(child.package.version, requested.spec)
  }
  if (nameMatch(tree)) {
    // this *is* the module, but it doesn't match the version, so a
    // new copy will have to be installed
    return versionMatch(tree) ? tree : null
  }

  var matches = tree.children.filter(nameMatch)
  if (matches.length) {
    matches = matches.filter(versionMatch)
    // the module exists as a dependent, but the version doesn't match, so
    // a new copy will have to be installed above here
    if (matches.length) return matches[0]
    return null
  }
  if (!tree.parent) return null
  return findRequirement(tree.parent, name, requested)
}

// Find the highest level in the tree that we can install this module in.
// If the module isn't installed above us yet, that'd be the very top.
// If it is, then it's the level below where its installed.
function earliestInstallable (requiredBy, tree, pkg) {
  var nameMatch = function (child) {
    return child.package.name === pkg.name
  }

  var nameMatches = tree.children.filter(nameMatch)
  if (nameMatches.length) return null

  // If any of the children of this tree have conflicting
  // binaries then we need to decline to install this package here.
  var binaryMatches = tree.children.filter(function (child) {
    return Object.keys(child.package.bin || {}).filter(function (bin) {
      return pkg.bin && pkg.bin[bin]
    }).length
  })
  if (binaryMatches.length) return null

  // if this tree location requested the same module then we KNOW it
  // isn't compatible because if it were findRequirement would have
  // found that version.
  if (requiredBy !== tree && tree.package.dependencies && tree.package.dependencies[pkg.name]) {
    return null
  }

  // FIXME: phantomChildren doesn't actually belong in the package.json
  if (tree.package._phantomChildren && tree.package._phantomChildren[pkg.name]) return null

  if (!tree.parent) return tree
  if (tree.isGlobal) return tree

  return (earliestInstallable(requiredBy, tree.parent, pkg) || tree)
}
