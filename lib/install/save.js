'use strict'

const BB = require('bluebird')

const createShrinkwrap = require('../shrinkwrap.js').createShrinkwrap
const deepSortObject = require('../utils/deep-sort-object.js')
const detectIndent = require('detect-indent')
const detectNewline = require('detect-newline')
const fs = require('graceful-fs')
const log = require('npmlog')
const moduleName = require('../utils/module-name.js')
const MyPrecious = require('libprecious')
const npm = require('../npm.js')
const pacoteOpts = require('../config/pacote.js')
const parseJSON = require('../utils/parse-json.js')
const path = require('path')
const stringifyPackage = require('../utils/stringify-package')
const validate = require('aproba')
const without = require('lodash.without')
const writeFileAtomic = BB.promisify(require('write-file-atomic'))

const readFileAsync = BB.promisify(fs.readFile)
const statAsync = BB.promisify(fs.stat)

// if the -S|--save option is specified, then write installed packages
// as dependencies to a package.json file.

exports.saveRequested = saveRequested
function saveRequested (tree) {
  validate('O', arguments)
  return savePackageJson(tree)
  .catch(warnError)
  .then(() => saveShrinkwrap(tree))
  .catch(warnError)
}

function warnError (err) {
  log.warn('saveError', err.message)
  log.verbose('saveError', err.stack)
}

exports.saveShrinkwrap = saveShrinkwrap
function saveShrinkwrap (tree) {
  validate('O', arguments)
  if (!npm.config.get('shrinkwrap') || !npm.config.get('package-lock')) {
    return
  }
  return BB.fromNode((cb) => createShrinkwrap(tree, {silent: false}, cb))
  .then(() => {
    if (!npm.config.get('archive')) {
      log.silly('saveArchive', 'skipping archive updates')
      return
    }
    log.silly('saveArchive', 'updating current package archive')
    return statAsync(path.resolve(tree.path, 'archived-packages'))
    .catch((err) => { if (err.code !== 'ENOENT') { throw err } })
    .then((stat) => {
      if (stat && stat.isDirectory()) {
        npm.config.toPacote = pacoteOpts
        const precious = new MyPrecious({
          config: npm.config,
          log
        })
        return precious.run()
        .then((info) => {
          if (info.pkgCount) {
            log.verbose('saveArchive', `archived ${info.pkgCount} packages`)
          }
          if (info.removed) {
            log.verbose('saveArchive', `removed ${info.removed} archived packages`)
          }
        })
      }
    })
  })
}

function savePackageJson (tree) {
  validate('O', arguments)
  const saveBundle = npm.config.get('save-bundle')

  // each item in the tree is a top-level thing that should be saved
  // to the package.json file.
  // The relevant tree shape is { <folder>: {what:<pkg>} }
  const saveTarget = path.resolve(tree.path, 'package.json')
  // don't use readJson, because we don't want to do all the other
  // tricky npm-specific stuff that's in there.
  return readFileAsync(saveTarget, 'utf8')
  .then((packagejson) => {
    const indent = detectIndent(packagejson).indent
    const newline = detectNewline(packagejson)
    tree.package = parseJSON(packagejson)

    // If we're saving bundled deps, normalize the key before we start
    let bundle
    if (saveBundle) {
      bundle = tree.package.bundleDependencies || tree.package.bundledDependencies
      delete tree.package.bundledDependencies
      if (!Array.isArray(bundle)) bundle = []
    }

    const toSave = getThingsToSave(tree)
    const toRemove = getThingsToRemove(tree)
    const savingTo = {}
    toSave.forEach((pkg) => { if (pkg.save) savingTo[pkg.save] = true })
    toRemove.forEach((pkg) => { if (pkg.save) savingTo[pkg.save] = true })

    Object.keys(savingTo).forEach((save) => {
      if (!tree.package[save]) tree.package[save] = {}
    })

    log.verbose('saving', toSave)
    const types = ['dependencies', 'devDependencies', 'optionalDependencies']
    toSave.forEach((pkg) => {
      if (pkg.save) tree.package[pkg.save][pkg.name] = pkg.spec
      const movedFrom = []
      for (let saveType of types) {
        if (
          pkg.save !== saveType &&
          tree.package[saveType] &&
          tree.package[saveType][pkg.name]
        ) {
          movedFrom.push(saveType)
          delete tree.package[saveType][pkg.name]
        }
      }
      if (movedFrom.length) {
        log.notice('save', `${pkg.name} is being moved from ${movedFrom.join(' and ')} to ${pkg.save}`)
      }
      if (saveBundle) {
        var ii = bundle.indexOf(pkg.name)
        if (ii === -1) bundle.push(pkg.name)
      }
    })

    toRemove.forEach((pkg) => {
      if (pkg.save) delete tree.package[pkg.save][pkg.name]
      if (saveBundle) {
        bundle = without(bundle, pkg.name)
      }
    })

    Object.keys(savingTo).forEach((key) => {
      tree.package[key] = deepSortObject(tree.package[key])
    })
    if (saveBundle) {
      tree.package.bundleDependencies = deepSortObject(bundle)
    }

    var json = stringifyPackage(tree.package, indent, newline)
    if (json === packagejson) {
      log.verbose('shrinkwrap', 'skipping write for package.json because there were no changes.')
      return
    } else {
      return writeFileAtomic(saveTarget, json)
    }
  })
}

exports.getSaveType = function (tree, arg) {
  if (arguments.length) validate('OO', arguments)
  var globalInstall = npm.config.get('global')
  var noSaveFlags = !npm.config.get('save') &&
                    !npm.config.get('save-dev') &&
                    !npm.config.get('save-prod') &&
                    !npm.config.get('save-optional')
  if (globalInstall || noSaveFlags) return null

  if (npm.config.get('save-optional')) {
    return 'optionalDependencies'
  } else if (npm.config.get('save-dev')) {
    return 'devDependencies'
  } else if (npm.config.get('save-prod')) {
    return 'dependencies'
  } else {
    if (arg) {
      var name = moduleName(arg)
      if (tree.package.optionalDependencies[name]) {
        return 'optionalDependencies'
      } else if (tree.package.devDependencies[name]) {
        return 'devDependencies'
      }
    }
    return 'dependencies'
  }
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

function getThingsToRemove (tree) {
  validate('O', arguments)
  if (!tree.removedChildren) return []
  var toRemove = tree.removedChildren.map(function (child) {
    return {
      name: moduleName(child),
      save: child.save
    }
  })
  return toRemove
}
