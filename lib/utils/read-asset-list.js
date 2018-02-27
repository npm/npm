'use strict'
module.exports = readAssetList

const path = require('path')
const Bluebird = require('bluebird')
const readdir = Bluebird.promisify(require('fs').readdir)
const readPackageJson = Bluebird.promisify(require('read-package-json'))

function readAssetList (assetsdir, log) {
  return readdir(assetsdir).then((files) => {
    return Bluebird.map(files, (file) => {
      const filepath = path.join(assetsdir, file)
      return readPackageJson(path.join(filepath, 'package.json'), log, false).then((pkg) => {
        return {
          path: filepath,
          realpath: filepath,
          isLink: false,
          isAsset: true,
          package: pkg
        }
      }).catch((_) => null)
    }).filter((asset) => asset != null)
  }).catch(() => [])
}

