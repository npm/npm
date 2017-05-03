'use strict'

const BB = require('bluebird')

const chain = require('slide').chain
const iferr = require('iferr')
const isDevDep = require('./install/is-dev-dep.js')
const isExtraneous = require('./install/is-extraneous.js')
const isOptDep = require('./install/is-opt-dep.js')
const isProdDep = require('./install/is-prod-dep.js')
const fs = BB.promisifyAll(require('graceful-fs'))
const lifecycle = require('./utils/lifecycle.js')
const log = require('npmlog')
const moduleName = require('./utils/module-name.js')
const move = require('move-concurrently')
const npm = require('./npm.js')
const packageId = require('./utils/package-id.js')
const path = require('path')
const readPackageJson = require('read-package-json')
const readPackageTree = require('read-package-tree')
const recalculateMetadata = require('./install/deps.js').recalculateMetadata
const ssri = require('ssri')
const validate = require('aproba')
const validatePeerDeps = require('./install/deps.js').validatePeerDeps
const writeFileAtomic = require('write-file-atomic')

const SHRINKWRAP = 'npm-shrinkwrap.json'
const PKGLOCK = 'package-lock.json'

// emit JSON describing versions of all packages currently installed (for later
// use with shrinkwrap install)
shrinkwrap.usage = 'npm shrinkwrap'

module.exports = exports = shrinkwrap
function shrinkwrap (args, silent, cb) {
  if (typeof cb !== 'function') {
    cb = silent
    silent = false
  }

  if (args.length) {
    log.warn('shrinkwrap', "doesn't take positional args")
  }

  var packagePath = path.join(npm.localPrefix, 'package.json')

  move(
    path.resolve(npm.prefix, PKGLOCK),
    path.resolve(npm.prefix, SHRINKWRAP),
    { Promise: BB }
  ).then(() => {
    log.notice('', `${PKGLOCK} has been renamed to ${SHRINKWRAP}. ${SHRINKWRAP} will be used for future installations.`)
    cb()
  }).catch({code: 'ENOENT'}, () => {
    readPackageJson(packagePath, iferr(cb, function (pkg) {
      createShrinkwrap(npm.localPrefix, pkg, silent, cb)
    }))
  })
}

module.exports.createShrinkwrap = createShrinkwrap

function createShrinkwrap (dir, pkg, silent, cb) {
  lifecycle(pkg, 'preshrinkwrap', dir, function () {
    readPackageTree(dir, andRecalculateMetadata(iferr(cb, function (tree) {
      var pkginfo = treeToShrinkwrap(tree)

      chain([
        [lifecycle, tree.package, 'shrinkwrap', dir],
        [shrinkwrap_, pkginfo, silent],
        [lifecycle, tree.package, 'postshrinkwrap', dir]
      ], iferr(cb, function (data) {
        cb(null, data[0])
      }))
    })))
  })
}

function andRecalculateMetadata (next) {
  validate('F', arguments)
  return function (er, tree) {
    validate('EO', arguments)
    if (er) return next(er)
    recalculateMetadata(tree, log, next)
  }
}

function treeToShrinkwrap (tree) {
  validate('O', arguments)
  var pkginfo = {}
  if (tree.package.name) pkginfo.name = tree.package.name
  if (tree.package.version) pkginfo.version = tree.package.version
  var problems = []
  if (tree.children.length) {
    shrinkwrapDeps(problems, pkginfo.dependencies = {}, tree)
  }
  if (problems.length) pkginfo.problems = problems
  return pkginfo
}

function shrinkwrapDeps (problems, deps, tree, seen) {
  validate('AOO', [problems, deps, tree])
  if (!seen) seen = {}
  if (seen[tree.path]) return
  seen[tree.path] = true
  Object.keys(tree.missingDeps).forEach(function (name) {
    var invalid = tree.children.filter(function (dep) { return moduleName(dep) === name })[0]
    if (invalid) {
      problems.push('invalid: have ' + invalid.package._id + ' (expected: ' + tree.missingDeps[name] + ') ' + invalid.path)
    } else if (!tree.package.optionalDependencies || !tree.package.optionalDependencies[name]) {
      var topname = packageId(tree)
      problems.push('missing: ' + name + '@' + tree.package.dependencies[name] +
        (topname ? ', required by ' + topname : ''))
    }
  })
  tree.children.sort(function (aa, bb) { return moduleName(aa).localeCompare(moduleName(bb)) }).forEach(function (child) {
    var childIsOnlyDev = isOnlyDev(child)
    var pkginfo = deps[moduleName(child)] = {}
    pkginfo.version = child.package.version
    if (child.package._inBundle) {
      pkginfo.bundled = true
    } else {
      pkginfo.resolved = child.package._resolved
      pkginfo.integrity = child.package._integrity
      if (!pkginfo.integrity && child.package._shasum) {
        pkginfo.integrity = ssri.fromHex(child.package._shasum, 'sha1')
      }
    }
    if (childIsOnlyDev) pkginfo.dev = true
    if (isOptional(child)) pkginfo.optional = true
    if (isExtraneous(child)) {
      problems.push('extraneous: ' + child.package._id + ' ' + child.path)
    }
    validatePeerDeps(child, function (tree, pkgname, version) {
      problems.push('peer invalid: ' + pkgname + '@' + version +
        ', required by ' + child.package._id)
    })
    if (child.children.length) {
      pkginfo.dependencies = {}
      shrinkwrapDeps(problems, pkginfo.dependencies, child, seen)
    }
  })
}

function shrinkwrap_ (pkginfo, silent, cb) {
  if (pkginfo.problems) {
    return cb(new Error('Problems were encountered\n' +
                        'Please correct and try again.\n' +
                        pkginfo.problems.join('\n')))
  }

  save(pkginfo, silent, cb)
}

function save (pkginfo, silent, cb) {
  // copy the keys over in a well defined order
  // because javascript objects serialize arbitrarily
  var swdata
  try {
    swdata = JSON.stringify(pkginfo, null, 2) + '\n'
  } catch (er) {
    log.error('shrinkwrap', 'Error converting package info to json')
    return cb(er)
  }

  BB.join(
    checkShrinkwrap(SHRINKWRAP),
    checkShrinkwrap(PKGLOCK),
    (shrinkwrap, lockfile) => {
      const file = (
        shrinkwrap ||
        lockfile ||
        path.resolve(npm.prefix, PKGLOCK)
      )
      writeFileAtomic(file, swdata, (err) => {
        if (err) return cb(err)
        if (silent) return cb(null, pkginfo)
        if (!shrinkwrap && !lockfile) {
          log.notice('', `created a lockfile as ${path.basename(file)}. You should commit this file.`)
        }
        cb(null, pkginfo)
      })
    }
  ).then((file) => {
  }, cb)
}

function checkShrinkwrap (name) {
  const file = path.resolve(npm.prefix, name)
  return fs.lstatAsync(
    file
  ).then(() => file).catch({code: 'ENOENT'}, () => {})
}

// Returns true if the module `node` is only required direcctly as a dev
// dependency of the top level or transitively _from_ top level dev
// dependencies.
// Dual mode modules (that are both dev AND prod) should return false.
function isOnlyDev (node, seen) {
  if (!seen) seen = {}
  return node.requiredBy.length && node.requiredBy.every(andIsOnlyDev(moduleName(node), seen))
}

// There is a known limitation with this implementation: If a dependency is
// ONLY required by cycles that are detached from the top level then it will
// ultimately return true.
//
// This is ok though: We don't allow shrinkwraps with extraneous deps and
// these situation is caught by the extraneous checker before we get here.
function andIsOnlyDev (name, seen) {
  return function (req) {
    var isDev = isDevDep(req, name)
    var isProd = isProdDep(req, name)
    if (req.isTop) {
      return isDev && !isProd
    } else {
      if (seen[req.path]) return true
      seen[req.path] = true
      return isOnlyDev(req, seen)
    }
  }
}

function isOptional (node, seen) {
  if (!seen) seen = {}
  // If a node is not required by anything, then we've reached
  // the top level package.
  if (seen[node.path] || node.requiredBy.length === 0) {
    return false
  }
  seen[node.path] = true

  return node.requiredBy.every(function (req) {
    return isOptDep(req, node.package.name) || isOptional(req, seen)
  })
}
