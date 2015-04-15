'use strict'
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var semver = require('semver')
var asyncMap = require('slide').asyncMap
var chain = require('slide').chain
var union = require('lodash.union')
var iferr = require('iferr')
var npa = require('npm-package-arg')
var validate = require('aproba')
var realizePackageSpecifier = require('realize-package-specifier')
var fetchPackageMetadata = require('../fetch-package-metadata.js')
var andAddParentToErrors = require('./and-add-parent-to-errors.js')
var addShrinkwrap = require('../fetch-package-metadata.js').addShrinkwrap
var addBundled = require('../fetch-package-metadata.js').addBundled
var inflateShrinkwrap = require('./inflate-shrinkwrap.js')
var andFinishTracker = require('./and-finish-tracker.js')
var npm = require('../npm.js')
var flatName = require('./flatten-tree.js').flatName
var createChild = require('./node.js').create
var resetMetadata = require('./node.js').reset

// The export functions in this module mutate a dependency tree, adding
// items to them.

function isDep (tree, child) {
  var requested = isProdDep(tree, child.package.name)
  var matches
  if (requested) matches = doesChildVersionMatch(child, requested)
  if (matches) return matches
  requested = isDevDep(tree, child.package.name)
  if (!requested) return
  return doesChildVersionMatch(child, requested)
}

function isDevDep (tree, name) {
  var devDeps = tree.package.devDependencies || {}
  var reqVer = devDeps[name]
  if (reqVer == null) return
  return npa(name + "@" + reqVer)
}

function isProdDep (tree, name) {
  var deps = tree.package.dependencies || {}
  var reqVer = deps[name]
  if (reqVer == null) return false
  return npa(name + "@" + reqVer)
}

var directTypes = { directory: true, local: true, remote: true }
function doesChildVersionMatch(child, requested) {
  var childReq = child.package._requested
  if (childReq && childReq.rawSpec == requested.rawSpec) return true
  if (childReq && childReq.type === requested.type && childReq.spec === requested.spec) return true
  if (!childReq && directTypes[requested.type] && requested.rawSpec === child.package._from) return true
  if (requested.type !== 'range' && requested.type !== 'version') return false
  return semver.satisfies(child.package.version, requested.spec)
}

var recalculateMetadata = exports.recalculateMetadata = function (tree, log, next) {
  validate('OOF', arguments)
  if (tree.parent == null) resetMetadata(tree)
  function markDeps (spec, done) {
    validate('SF', arguments)
    realizePackageSpecifier(spec, tree.path, function (er, req) {
      if (er) return done()
      var child = findRequirement(tree, req.name, req)
      if (child) {
        resolveWithExistingModule(child, child.package, tree, log, function () { done() })
      } else if (tree.package.dependencies[req.name] != null) {
        tree.missingDeps[req.name] = req.rawSpec
        done()
      } else {
        done()
      }
    })
  }
  function deptospec (deps) {
    return function (depname) {
      return depname + '@' + deps[depname]
    }
  }
  var tomark = union(
    Object.keys(tree.package.dependencies).map(deptospec(tree.package.dependencies)),
    Object.keys(tree.package.devDependencies).map(deptospec(tree.package.devDependencies))
  )
  chain([
    [asyncMap, tomark, markDeps],
    [asyncMap, tree.children, function (child, done) { recalculateMetadata(child, log, done) }]
  ], function () { next(null, tree) })
}

function addRequiredDep(tree, child) {
  if (!isDep(tree, child)) return false
  var name = isProdDep(tree, child.package.name) ? flatNameFromTree(tree) : "#DEV:"+flatNameFromTree(tree)
  child.package._requiredBy = union(child.package._requiredBy || [], [name])
  child.requiredBy = union(child.requiredBy || [], [tree])
  return true
}

// Add a list of args to tree's top level dependencies
exports.loadRequestedDeps = function (args, tree, saveToDependencies, log, next) {
  validate('AOOF', [args, tree, log, next])
  asyncMap(args, function (spec, done) {
    var depLoaded = andAddParentToErrors(tree, done)
    fetchPackageMetadata(spec, tree.path, log.newGroup('fetchMetadata'), iferr(depLoaded, function (pkg) {
      tree.children = tree.children.filter(function (child) {
        return child.package.name !== pkg.name
      })
      resolveWithNewModule(pkg, tree, log.newGroup('loadRequestedDeps'), iferr(depLoaded, function (child, tracker) {
        validate('OO', arguments)
        if (npm.config.get('global')) {
          child.isGlobal = true
        }
        if (saveToDependencies) {
          tree.package[saveToDependencies][child.package.name] = child.package._requested.spec
        }
        if (saveToDependencies && saveToDependencies !== 'devDependencies') {
          tree.package.dependencies[child.package.name] = child.package._requested.spec
        }
        child.directlyRequested = true
        child.save = saveToDependencies

        // For things the user asked to install, that aren't a dependency (or
        // won't be when we're done), flag it as "depending" on the user
        // themselves, so we don't remove it as a dep that no longer exists
        if (! addRequiredDep(tree, child)) {
          child.package._requiredBy = union(child.package._requiredBy, ['#USER'])
        }
        recalculateMetadata(tree, log, function () {
          depLoaded(null, child, tracker)
        })
      }))
    }))
  }, andForEachChild(loadDeps, andFinishTracker(log, next)))
}

exports.removeDeps = function (args, tree, saveToDependencies, log, next) {
  validate('AOOF', [args, tree, log, next])
  asyncMap(args, function (name, done) {
    var toRemove = tree.children.filter(function (child) { return child.package.name === name })
    tree.removed = union(tree.removed || [], toRemove)
    toRemove.forEach(function (child) {
      child.save = saveToDependencies
    })
    tree.children = tree.children.filter(function (child) { return child.package.name !== name })
    done()
  }, andFinishTracker(log, next))
}

function andForEachChild (load, next) {
  validate('F', [next])
  return function (er, children, logs) {
    // when children is empty, logs won't be passed in at all (asyncMap is weird)
    // so shortcircuit before arg validation
    if (!er && (!children || children.length === 0)) return next()
    validate('EAA', arguments)
    if (er) return next(er)
    assert(children.length === logs.length)
    var cmds = []
    for (var ii = 0; ii < children.length; ++ii) {
      cmds.push([load, children[ii], logs[ii]])
    }
    var sortedCmds = cmds.sort(function installOrder (aa, bb) {
      return aa[1].package.name.localeCompare(bb[1].package.name)
    })
    chain(sortedCmds, next)
  }
}

function depAdded (done) {
  validate('F', arguments)
  return function () {
    validate('EOO', arguments)
    done.apply(null, arguments)
  }
}

// Load any missing dependencies in the given tree
exports.loadDeps = loadDeps
function loadDeps (tree, log, next) {
  validate('OOF', arguments)
  if (tree.loaded) return andFinishTracker.now(log, next)
  tree.loaded = true
  if (!tree.package.dependencies) tree.package.dependencies = {}
  asyncMap(Object.keys(tree.package.dependencies), function (dep, done) {
    var version = tree.package.dependencies[dep]
    if (tree.package.optionalDependencies &&
        tree.package.optionalDependencies[dep]) {
      done = andWarnOnError(log, done)
    }
    addDependency(dep, version, tree, log.newGroup('loadDep:' + dep), depAdded(done))
  }, andForEachChild(loadDeps, andFinishTracker(log, next)))
}

function andWarnOnError (log, next) {
  validate('OF', arguments)
  return function (er, child, childLog) {
    validate('EOO', arguments)
    if (er) {
      log.warn('install', "Couldn't install optional dependency:", er.message)
      log.verbose('install', er.stack)
    }
    next(null, child, childLog)
  }
}

// Load development dependencies into the given tree
exports.loadDevDeps = function (tree, log, next) {
  validate('OOF', arguments)
  if (!tree.package.devDependencies) return andFinishTracker.now(log, next)
  asyncMap(Object.keys(tree.package.devDependencies), function (dep, done) {
    // things defined as both dev dependencies and regular dependencies are treated
    // as the former
    if (tree.package.dependencies[dep]) return done()

    var logGroup = log.newGroup('loadDevDep:' + dep)
    addDependency(dep, tree.package.devDependencies[dep], tree, logGroup, done)
  }, andForEachChild(loadDeps, andFinishTracker(log, next)))
}

exports.loadExtraneous = function loadExtraneous (tree, log, next) {
  validate('OOF', arguments)
  asyncMap(tree.children.filter(function (child) { return !child.loaded }), function (child, done) {
    resolveWithExistingModule(child, child.package, tree, log, done)
  }, andForEachChild(loadExtraneous, andFinishTracker(log, next)))
}

function addDependency (name, versionSpec, tree, log, done) {
  validate('SSOOF', arguments)
  var cb = function (er, child, log) {
    validate('EOO', arguments)
    if (er) return done(er)
    done(null, child, log)
  }
  var next = andAddParentToErrors(tree, cb)
  var spec = name + '@' + versionSpec
  realizePackageSpecifier(spec, tree.path, function (er, req) {
    var child = findRequirement(tree, name, req)
    if (child) {
      resolveWithExistingModule(child, child.package, tree, log, next)
    }
    else {
      resolveWithNewModule(req, tree, log, next)
    }
  })
}

function resolveWithExistingModule (child, pkg, tree, log, next) {
  validate('OOOOF', arguments)
  if (child.package !== pkg) {
    if (!child.package._requested) {
      child.package._requested = pkg._requested
    }
    if (child.package._requested && child.package._requested.spec !== pkg._requested.spec && (child.package._requested.type === "version" || child.package._requested.type === "range")) {
      child.package._requested.spec += ' ' + pkg._requested.spec
      child.package._requested.type = 'range'
    }
  }
  addRequiredDep(tree, child)

  tree.requires = union(tree.requires || [], [child])

  if (tree.parent && child.parent !== tree) updatePhantomChildren(tree.parent, child)

  if (!child.loaded && pkg._shrinkwrap === undefined) {
    fs.readFile(path.join(child.path, 'npm-shrinkwrap.json'), function (er, data) {
      if (er) {
        pkg._shrinkwrap = null
        return next(null, child, log)
      }
      try {
        pkg._shrinkwrap = JSON.parse(data)
      } catch (ex) {
        return next(null, child, log)
      }
      if (pkg._shrinkwrap && pkg._shrinkwrap.dependencies) {
        return inflateShrinkwrap(child, pkg._shrinkwrap.dependencies, iferr(next, function () {
          next(null, child, log)
        }))
      } else {
        return next(null, child, log)
      }
    })
  } else {
    return next(null, child, log)
  }
}

var updatePhantomChildren = exports.updatePhantomChildren = function (current, child) {
  validate('OO', arguments)
  while (current && current !== child.parent) {
    // FIXME: phantomChildren doesn't actually belong in the package.json
    if (!current.package._phantomChildren) current.package._phantomChildren = {}
    current.package._phantomChildren[child.package.name] = child.package.version
    current = current.parent
  }
}

function flatNameFromTree (tree) {
  validate('O', arguments)
  if (!tree.parent) return '/'
  var path = flatNameFromTree(tree.parent)
  if (path !== '/') path += '/'
  return flatName(path, tree)
}

function resolveWithNewModule (pkg, tree, log, next) {
  validate('OOOF', arguments)
  if (pkg.type) {
    return fetchPackageMetadata(pkg, tree.path, log.newItem('fetchMetadata'), iferr(next, function (pkg) {
      resolveWithNewModule(pkg, tree, log, next)
    }))
  }

  pkg._from = pkg._requested.name + '@' + pkg._requested.spec
  addShrinkwrap(pkg, iferr(next, function () {
    addBundled(pkg, iferr(next, function () {
      var parent = earliestInstallable(tree, tree, pkg) || tree
      var child = createChild({
        package: pkg,
        parent: parent,
        path: path.join(parent.path, 'node_modules', pkg.name),
        realpath: path.resolve(parent.realpath, 'node_modules', pkg.name),
        children: pkg._bundled || [],
        isLink: tree.isLink
      })

      parent.children = parent.children.filter(function (pkg) { return pkg.package.name !== child.package.name })
      parent.children.push(child)
      addRequiredDep(tree, child)

      if (tree.parent && parent !== tree) updatePhantomChildren(tree.parent, child)

      tree.requires = union(tree.requires || [], [child])

      if (pkg._bundled) {
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
  validate('OA', arguments)
  children.forEach(function (child) {
    child.fromBundle = true
    child.parent = parent
    child.path = path.join(parent.path, child.package.name)
    child.realpath = path.resolve(parent.realpath, child.package.name)
    child.isLink = parent.isLink || parent.target || child.path !== child.realpath
    inflateBundled(child, child.children)
  })
}

exports.validatePeerDeps = function validatePeerDeps (tree, log) {
  validate('OO', arguments)
  if (tree.package.peerDependencies) {
    Object.keys(tree.package.peerDependencies).forEach(function (pkgname) {
      var version = tree.package.peerDependencies[pkgname]
      var match = findRequirement(tree, pkgname, npa(pkgname + "@" + version))
      if (!match) {
        log.warn('validatePeerDeps', tree.package.name + '@' + tree.package.version +
          ' requires a peer of ' + pkgname + '@' + version + ' but none was installed.')
      }
    })
  }
  tree.children.forEach(function (child) { validatePeerDeps(child, log) })
}

// Determine if a module requirement is already met by the tree at or above
// our current location in the tree.
var findRequirement = exports.findRequirement = function (tree, name, requested) {
  validate('OSO', arguments)
  var nameMatch = function (child) {
    return child.package.name === name && child.parent
  }
  var versionMatch = function (child) {
     return doesChildVersionMatch(child, requested)
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
var earliestInstallable = exports.earliestInstallable = function (requiredBy, tree, pkg) {
  validate('OOO', arguments)
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
