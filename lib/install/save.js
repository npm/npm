'use strict'

const BB = require('bluebird')

const createShrinkwrap = require('../shrinkwrap.js').createShrinkwrap
const deepSortObject = require('../utils/deep-sort-object.js')
const detectIndent = require('detect-indent')
const fs = BB.promisifyAll(require('graceful-fs'))
const iferr = require('iferr')
const log = require('npmlog')
const moduleName = require('../utils/module-name.js')
const npm = require('../npm.js')
const parseJSON = require('../utils/parse-json.js')
const path = require('path')
const validate = require('aproba')
const without = require('lodash.without')
const writeFileAtomic = require('write-file-atomic')

// if the -S|--save option is specified, then write installed packages
// as dependencies to a package.json file.

exports.saveRequested = function (args, tree, andReturn) {
  validate('AOF', arguments)
  savePackageJson(args, tree, andWarnErrors(andSaveShrinkwrap(tree, andReturn)))
}

function andSaveShrinkwrap (tree, andReturn) {
  validate('OF', arguments)
  return function (er) {
    validate('E', arguments)
    saveShrinkwrap(tree, andWarnErrors(andReturn))
  }
}

function andWarnErrors (cb) {
  validate('F', arguments)
  return function (er) {
    if (er) log.warn('saveError', er.message)
    arguments[0] = null
    cb.apply(null, arguments)
  }
}

function saveShrinkwrap (tree, next) {
  validate('OF', arguments)
  createShrinkwrap(tree.path, tree.package, {silent: false}, next)
}

function savePackageJson (args, tree, next) {
  validate('AOF', arguments)
  if (!args || !args.length) { return next() }

  var saveBundle = npm.config.get('save-bundle')

  // each item in the tree is a top-level thing that should be saved
  // to the package.json file.
  // The relevant tree shape is { <folder>: {what:<pkg>} }
  var saveTarget = path.resolve(tree.path, 'package.json')
  // don't use readJson, because we don't want to do all the other
  // tricky npm-specific stuff that's in there.
  fs.readFile(saveTarget, 'utf8', iferr(next, function (packagejson) {
    const indent = detectIndent(packagejson).indent || '  '
    try {
      packagejson = parseJSON(packagejson)
    } catch (ex) {
      return next(ex)
    }

    // If we're saving bundled deps, normalize the key before we start
    if (saveBundle) {
      var bundle = packagejson.bundleDependencies || packagejson.bundledDependencies
      delete packagejson.bundledDependencies
      if (!Array.isArray(bundle)) bundle = []
    }

    var toSave = getThingsToSave(tree)
    var toRemove = getThingsToRemove(args, tree)
    var savingTo = {}
    toSave.forEach(function (pkg) { savingTo[pkg.save] = true })
    toRemove.forEach(function (pkg) { savingTo[pkg.save] = true })

    Object.keys(savingTo).forEach(function (save) {
      if (!packagejson[save]) packagejson[save] = {}
    })

    log.verbose('saving', toSave)
    toSave.forEach(function (pkg) {
      packagejson[pkg.save][pkg.name] = pkg.spec
      if (saveBundle) {
        var ii = bundle.indexOf(pkg.name)
        if (ii === -1) bundle.push(pkg.name)
      }
    })

    toRemove.forEach(function (pkg) {
      delete packagejson[pkg.save][pkg.name]
      if (saveBundle) {
        bundle = without(bundle, pkg.name)
      }
    })

    Object.keys(savingTo).forEach(function (key) {
      packagejson[key] = deepSortObject(packagejson[key])
    })
    if (saveBundle) {
      packagejson.bundledDependencies = deepSortObject(bundle)
    }

    var json = JSON.stringify(packagejson, null, indent) + '\n'
    writeFileAtomic(saveTarget, json, next)
  }))
}

var getSaveType = exports.getSaveType = function (args) {
  validate('A', arguments)
  var globalInstall = npm.config.get('global')
  var noSaveFlags = !npm.config.get('save') &&
                    !npm.config.get('save-dev') &&
                    !npm.config.get('save-optional')
  if (globalInstall || noSaveFlags) return null

  if (npm.config.get('save-optional')) return 'optionalDependencies'
  else if (npm.config.get('save-dev')) return 'devDependencies'
  else return 'dependencies'
}

function getThingsToSave (tree) {
  validate('O', arguments)
  var toSave = tree.children.filter(function (child) {
    return child.save
  }).map(function (child) {
    return {
      name: moduleName(child),
      spec: child.saveSpec,
      save: child.save
    }
  })
  return toSave
}

function getThingsToRemove (args, tree) {
  validate('AO', arguments)
  if (!tree.removed) return []
  var toRemove = tree.removed.map(function (child) {
    return {
      name: moduleName(child),
      save: child.save
    }
  })
  var saveType = getSaveType(args)
  args.forEach(function (arg) {
    toRemove.push({
      name: arg,
      save: saveType
    })
  })
  return toRemove
}
