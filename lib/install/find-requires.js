'use strict'

const BB = require('bluebird')

const detective = require('babel-plugin-detective')
const glob = BB.promisify(require('glob'))
const isBuiltin = require('is-builtin-module')
const path = require('path')
const transformFile = BB.promisify(require('babel-core').transformFile)

module.exports = findDeps
function findDeps (mod) {
  const pkgPath = require.resolve(path.resolve(mod, 'package.json'))
  if (!pkgPath) { return BB.resolve(new Set()) }
  const pkg = require(pkgPath)
  const sources = [pkg.main || 'index.js'].concat(pkg.files || ['*'])
  return BB.reduce(sources, (acc, src) => {
    return BB.join(
      glob(path.join(mod, src)),
      glob(path.join(mod, src, '**')),
      (a, b) => a.concat(b)
    ).then((files) => acc.concat(files))
  }, [])
  .mapSeries(getTreeDeps)
  .reduce((acc, deps) => {
    for (var elem of deps) {
      acc.add(elem)
    }
    return acc
  }, new Set())
  .then(Array.from)
}

const seen = new Set()
function getTreeDeps (root) {
  return getFileDeps(path.resolve(root), {}).reduce((acc, dep) => {
    if (dep.pathDep && seen.has(path.resolve(dep.require))) {
      return acc
    } else if (dep.pathDep) {
      const resolved = path.resolve(dep.require)
      return getTreeDeps(resolved).then((deps) => {
        for (var elem of deps) {
          acc.add(elem)
        }
        return acc
      })
    } else if (!isBuiltin(dep.require)) {
      return acc.add(dep.require)
    } else {
      return acc
    }
  }, new Set())
}

function getFileDeps (file, opts) {
  let target
  try {
    target = require.resolve(file)
  } catch (e) {
    return BB.resolve([])
  }
  if (path.extname(target) !== '.js') { return BB.resolve([]) }
  return transformFile(require.resolve(file), {
    plugins: [[detective, opts]],
    sourceRoot: __filename
  }).then((result) => {
    const meta = detective.metadata(result)
    if (!meta) { return BB.resolve([]) }
    return meta.strings.map((req) => {
      if (
        req.indexOf('../') === 0 ||
        req.indexOf('./') === 0 ||
        req[0] === '/'
      ) {
        return {
          pathDep: true,
          require: path.join(path.dirname(file), req)
        }
      } else {
        return {
          pathDep: false,
          require: req
        }
      }
    })
  })
}
